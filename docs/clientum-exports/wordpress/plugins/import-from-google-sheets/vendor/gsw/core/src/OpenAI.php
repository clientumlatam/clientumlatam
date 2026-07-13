<?php
namespace GSW\Core;

use GSW\Core\Logs;

if (!defined('ABSPATH')) exit;

/**
 * OpenAI integration:
 * - Reads config from option 'gsw_openai' (api_key, model, system_prompt, prompt, temperature, max_tokens).
 * - Builds message variables from normalized item.
 * - Calls Chat Completions API and expects STRICT JSON:
 *     {"title":"...","short":"...","full":"..."}
 * - Safe JSON parsing (tolerant to extra prose).
 * - Test endpoint via admin-post: gsw_test_openai
 */
class OpenAI
{
    const OPT = 'gsw_openai';
    const NONCE = 'gsw_openai';

    public static function default_system_prompt(): string
    {
        return self::default_system();
    }

    public static function default_user_prompt(): string
    {
        return self::default_prompt();
    }

    public static function boot(): void
    {
        add_action('admin_post_gsw_test_openai', [self::class, 'handle_test']);
    }

    /** Public: generate content for a product; returns ['title','short','full'] or empty on failure. */
    public static function generate(array $vars, string $rowId): array
    {
        $cfg = self::config();
        if (empty($cfg['api_key'])) {
            Logs::write($rowId, 'error', 'OpenAI: API key not set');
            return [];
        }

        $system = self::render_template($cfg['system_prompt'], $vars);
        $user   = self::render_template($cfg['prompt'], $vars);

        // Append strict output instruction WITHOUT altering user's content rules
        $user = self::append_output_footer($user);

        $messages = [
            ['role' => 'system', 'content' => $system],
            ['role' => 'user',   'content' => $user],
        ];

        $payload = [
            'model'       => $cfg['model'],
            'messages'    => $messages,
            'temperature' => (float)$cfg['temperature'],
            'max_tokens'  => (int)$cfg['max_tokens'],
            // keep it simple/standard; no tool calls etc.
        ];

        $res = self::post_json('https://api.openai.com/v1/chat/completions', $payload, $cfg['api_key'], $rowId);
        if (!$res || empty($res['choices'][0]['message']['content'])) {
            Logs::write($rowId, 'error', 'OpenAI: empty response');
            return false;
        }

        // $content = (string)$res['choices[0][message][content]'] ?? (string)$res['choices'][0]['message']['content'];
        $content = isset($res['choices'][0]['message']['content'])
                    ? (string) $res['choices'][0]['message']['content']
                    : '';
        
        $data = self::extract_json($content);
        if (!$data || !is_array($data)) {
            Logs::write($rowId, 'error', 'OpenAI: JSON parse failed', ['preview'=>mb_substr($content, 0, 120)]);
            return [];
        }

        // Normalize keys
        $title = trim((string)($data['title'] ?? ''));
        $short = trim((string)($data['short'] ?? ''));
        $full  = trim((string)($data['full']  ?? ''));

        return ($title !== '' || $short !== '' || $full !== '') ? compact('title','short','full') : [];
    }

    /** Settings → "Test API" handler. */
    public static function handle_test(): void
    {
        if (!ditsgsw_current_user_can_manage()) wp_die(esc_html__('Unauthorized', DITSGSW_TEXT_DOMAIN));
        check_admin_referer(self::NONCE);

        $r = self::quick_ping();
        
        $key = 'gsw_notice_' . get_current_user_id();
        if ($r['ok']) {
            set_transient($key, 'success|' . __('OpenAI test passed.', DITSGSW_TEXT_DOMAIN), 30);
        } else {
            set_transient($key, 'error|' . sprintf(__('OpenAI test failed: %s', DITSGSW_TEXT_DOMAIN), $r['msg']), 30);
        }
        wp_safe_redirect(admin_url('admin.php?page=gsw-settings'));
        exit;
    }

    /** Build variables for prompts from normalized item. */
    public static function vars_from_normalized(array $n, array $extra = []): array
    {
        $isSale = (string)($n['status'] ?? '') === 'sale';
        $rrpText = '';
        if (!empty($n['price_sale'])) {
            $rrpText = sprintf('Regular: %s; Sale: %s', (string)$n['price_regular'], (string)$n['price_sale']);
        } else {
            $rrpText = sprintf('Price: %s', (string)$n['price_regular']);
        }

        $sizes = is_array($n['sizes'] ?? null) ? $n['sizes'] : [];
        $sizesList = implode(', ', array_map(fn($s)=>trim((string)($s['name'] ?? '')), $sizes));
        $languageRaw = (string)($extra['language'] ?? get_locale());

        $vars = [
            'sku'           => (string)($n['sku'] ?? ''),
            'title'         => (string)($n['title'] ?? ''),
            'description'   => (string)($n['description'] ?? ''),
            'status'        => (string)($n['status'] ?? 'in_stock'), // in_stock|sale|waiting|sold|unknown
            'is_sale'       => $isSale ? 'true' : 'false',
            'sale_percent'  => (string)($extra['sale_percent'] ?? ''),
            'has_sizes'     => $sizes ? 'true' : 'false',
            'sizes_count'   => (string)count($sizes),
            'sizes_list'    => $sizesList,
            'rrp_text'      => $rrpText,
            'category_name' => (string)($extra['category_name'] ?? ''),
            'language'      => self::resolve_language_name($languageRaw),
        ];

        if (isset($extra['prev_status'])) {
            $vars['prev_status'] = (string)$extra['prev_status'];
        }

        return $vars;
    }

    /** --------------- Internals --------------- */

    protected static function config(): array
    {
        $opt = (array) get_option(self::OPT, []);

        // Defaults
        $api_key   = (string)($opt['api_key'] ?? '');
        $model = trim((string)($opt['model'] ?? ''));
        if ($model === '') $model = 'gpt-4o';
        
        $sys = self::resolve_prompt($opt['system_prompt'] ?? null, self::default_system());
        $usr = self::resolve_prompt($opt['prompt']        ?? null, self::default_prompt());
        
        $temp      = isset($opt['temperature']) ? (float)$opt['temperature'] : 0.4;
        $maxTokens = isset($opt['max_tokens']) ? (int)$opt['max_tokens'] : 800;

        return [
            'api_key'       => $api_key,
            'model'         => $model,
            'system_prompt' => $sys,
            'prompt'        => $usr,
            'temperature'   => $temp,
            'max_tokens'    => $maxTokens,
        ];
    }

    /** Empty -> default. If it starts with "+=", append to the default. Otherwise, replace the default. */
    protected static function resolve_prompt($raw, string $default): string
    {
        $s = is_string($raw) ? trim($raw) : '';
        if ($s === '') return $default;

        if (str_starts_with($s, '+=')) {
            $addon = ltrim(mb_substr($s, 2));
            return self::compose_prompt($default, $addon);
        }
        // otherwise - an explicit replacement of the default
        return $s;
    }

    /** Carefully “glue” the supplement with a block with a separator */
    protected static function compose_prompt(string $base, string $addon): string
    {
        $addon = trim($addon);
        if ($addon === '') return $base;

        return rtrim($base) . "\n\n" .
            "Additional rule(s):\n" .
            $addon . "\n";
    }

    protected static function default_system(): string
    {
        /* translators: Keep {{language}} variable and JSON keys exactly: "title", "short", "full". */
        return __(
            "You are a product copywriter for an online store. Output must be compact, skimmable, and conversion-oriented.\n"
            . "Write in the same language as the input ({{language}}).\n"
            . "STRICTLY return only valid JSON with keys: \"title\", \"short\", \"full\". No explanations.",
            DITSGSW_TEXT_DOMAIN
        );
    }

    protected static function default_prompt(): string
    {
        /* translators: Keep all {{variables}} intact and JSON keys exactly: title/short/full. */
        return __(
            "Input:\n"
            . "- Title: {{title}}\n"
            . "- Description: {{description}}\n"
            . "- Status: {{status}} (prev: {{prev_status}})\n"
            . "- Is sale: {{is_sale}} (sale_percent={{sale_percent}})\n"
            . "- Sizes: has={{has_sizes}} count={{sizes_count}} list={{sizes_list}}\n"
            . "- Price/RRP: {{rrp_text}}\n"
            . "- Category: {{category_name}}\n"
            . "\n"
            . "Task:\n"
            . "1) Create a concise SEO title (40–60 chars) — include size or sale info if useful.\n"
            . "2) Create a short description (100–150 chars) — benefits & key features; mention sale if {{is_sale}}.\n"
            . "3) Create a full description (500–900 chars) — bullet-style paragraphs, specs hints, care/use tips; adapt if status is waiting/sold.\n"
            . "\n"
            . "Return STRICT JSON: {\"title\":\"...\",\"short\":\"...\",\"full\":\"...\"}",
            DITSGSW_TEXT_DOMAIN
        );
    }

    protected static function render_template(string $tpl, array $vars): string
    {
        $rep = [];
        foreach ($vars as $k=>$v) $rep['{{'.$k.'}}'] = (string)$v;
        return strtr($tpl, $rep);
    }

    /**
     * Convert a locale like "uk", "ru_RU" or "en_US" into a readable language name
     * so prompts can reliably ask the model to answer in the intended language.
     */
    protected static function resolve_language_name(string $raw): string
    {
        $value = trim($raw);
        if ($value === '') {
            $value = (string) get_locale();
        }

        // Allow callers to pass a ready-made language label.
        if (!preg_match('/^[A-Za-z]{2,3}(?:[_-][A-Za-z]{2,8})?$/', $value)) {
            return $value;
        }

        $locale = str_replace('-', '_', $value);
        $norm   = strtolower($locale);
        $lang   = strtok($norm, '_') ?: $norm;

        $map = [
            'uk' => 'Ukrainian',
            'ru' => 'Russian',
            'en' => 'English',
            'es' => 'Spanish',
            'de' => 'German',
            'fr' => 'French',
            'it' => 'Italian',
            'pl' => 'Polish',
            'pt' => 'Portuguese',
            'nl' => 'Dutch',
            'tr' => 'Turkish',
            'cs' => 'Czech',
            'sk' => 'Slovak',
            'ro' => 'Romanian',
            'hu' => 'Hungarian',
        ];

        if (isset($map[$norm])) {
            return $map[$norm];
        }
        if (isset($map[$lang])) {
            return $map[$lang];
        }

        if (class_exists('\Locale') && method_exists('\Locale', 'getDisplayLanguage')) {
            $display = \Locale::getDisplayLanguage(str_replace('_', '-', $locale), 'en');
            if (is_string($display) && trim($display) !== '') {
                return $display;
            }
        }

        return $value;
    }

    protected static function post_json(string $url, array $payload, string $apiKey, string $rowId): ?array
    {
        $args = [
            'timeout' => 25,
            'headers' => [
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type'  => 'application/json',
            ],
            'body'    => wp_json_encode($payload),
        ];
        $resp = wp_remote_post($url, $args);
        if (is_wp_error($resp)) {
            Logs::write($rowId, 'error', 'OpenAI HTTP error: ' . $resp->get_error_message());
            return null;
        }
        $code = (int) wp_remote_retrieve_response_code($resp);
        $body = (string) wp_remote_retrieve_body($resp);
        if ($code < 200 || $code >= 300) {
            Logs::write($rowId, 'error', 'OpenAI HTTP ' . $code, ['body'=>$body]);
            return null;
        }
        $json = json_decode($body, true);
        return is_array($json) ? $json : null;
    }

    /** Extract first valid JSON object from text. */
    protected static function extract_json(string $text): ?array
    {
        // Fast path
        $data = json_decode($text, true);
        if (is_array($data)) return $data;

        // Tolerant scan: find first {...} and try decode
        $start = strpos($text, '{');
        $end   = strrpos($text, '}');
        if ($start === false || $end === false || $end <= $start) return null;

        $snippet = substr($text, $start, $end - $start + 1);
        $data = json_decode($snippet, true);
        return is_array($data) ? $data : null;
    }

    protected static function quick_ping(string $rowId = 'test'): array
    {
        $cfg = self::config();
        if (empty($cfg['api_key'])) {
            return ['ok' => false, 'msg' => 'API key is empty'];
        }

        $payload = [
            'model'    => $cfg['model'],
            'messages' => [
                ['role' => 'system', 'content' => 'You are a concise assistant.'],
                ['role' => 'user',   'content' => 'Reply with only: OK'],
            ],
            'temperature' => 0,
            'stream'      => false,
        ];

        $res = self::post_json('https://api.openai.com/v1/chat/completions', $payload, $cfg['api_key'], $rowId);
        if (!$res) return ['ok' => false, 'msg' => 'HTTP or JSON error'];

        $text = isset($res['choices'][0]['message']['content'])
            ? (string)$res['choices'][0]['message']['content']
            : '';

        $ok = (mb_strtoupper(trim($text)) === 'OK');
        if (!$ok) {
            Logs::write($rowId, 'error', 'OpenAI test: unexpected body', ['preview' => mb_substr($text, 0, 120)]);
        }
        return ['ok' => $ok, 'msg' => $ok ? 'OK' : ('Unexpected reply: ' . mb_substr($text, 0, 60))];
    }

    public static function test_connection( string $api_key, string $model = '' ): array
    {
        if ( $api_key === '' ) {
            return [
                'ok'      => false,
                'message' => __( 'OpenAI API key is empty.', DITSGSW_TEXT_DOMAIN ),
            ];
        }

        // Validate key via Models endpoint (cheap + fast)
        $resp = wp_remote_get( 'https://api.openai.com/v1/models', [
            'timeout' => 20,
            'headers' => [
                'Authorization' => 'Bearer ' . $api_key,
            ],
        ] );

        if ( is_wp_error( $resp ) ) {
            return [
                'ok'      => false,
                'message' => 'HTTP error: ' . $resp->get_error_message(),
            ];
        }

        $code = (int) wp_remote_retrieve_response_code( $resp );
        $body = (string) wp_remote_retrieve_body( $resp );

        $json = json_decode( $body, true );
        if ( $code < 200 || $code >= 300 ) {
            $msg = $json['error']['message'] ?? $body;
            return [
                'ok'      => false,
                'message' => sprintf(
                    __( 'OpenAI API error (%d): %s', DITSGSW_TEXT_DOMAIN ),
                    $code,
                    (string) $msg
                ),
            ];
        }

        $message = __( 'OpenAI connected. API key is valid.', DITSGSW_TEXT_DOMAIN );

        // Optional: validate selected model via tiny Chat Completions call
        $model = trim( (string) $model );
        if ( $model !== '' ) {
            $resp2 = wp_remote_post( 'https://api.openai.com/v1/chat/completions', [
                'timeout' => 25,
                'headers' => [
                    'Authorization' => 'Bearer ' . $api_key,
                    'Content-Type'  => 'application/json',
                ],
                'body' => wp_json_encode( [
                    'model'       => $model,
                    'temperature' => 0,
                    'max_tokens'  => 8,
                    'messages'    => [
                        [ 'role' => 'system', 'content' => 'ping' ],
                        [ 'role' => 'user',   'content' => 'Reply with OK.' ],
                    ],
                ] ),
            ] );

            if ( is_wp_error( $resp2 ) ) {
                return [
                    'ok'      => false,
                    'message' => 'HTTP error: ' . $resp2->get_error_message(),
                ];
            }

            $code2 = (int) wp_remote_retrieve_response_code( $resp2 );
            $body2 = (string) wp_remote_retrieve_body( $resp2 );

            $json2 = json_decode( $body2, true );
            if ( $code2 < 200 || $code2 >= 300 ) {
                $msg2 = $json2['error']['message'] ?? $body2;
                return [
                    'ok'      => false,
                    'message' => sprintf(
                        __( 'Model test failed (%1$s): %2$s', DITSGSW_TEXT_DOMAIN ),
                        $model,
                        (string) $msg2
                    ),
                ];
            }

            $message = sprintf(
                __( 'OpenAI connected. Model "%s" is accessible.', DITSGSW_TEXT_DOMAIN ),
                $model
            );
        }

        return [
            'ok'      => true,
            'message' => $message,
        ];
    }

    /**
     * Hard footer: enforces ONLY output format, without changing content rules.
     */
    protected static function hard_json_footer(): string
    {
        return
            "OUTPUT FORMAT (STRICT):\n"
            . "Return ONLY one valid JSON object with EXACT keys: title, short, full.\n"
            . "No extra keys. No markdown. No code fences. No commentary.\n"
            . "All values must be strings. Escape quotes/newlines properly.\n"
            . "Example (structure only): {\"title\":\"...\",\"short\":\"...\",\"full\":\"...\"}\n";
    }

    /** Append footer to any prompt content. */
    protected static function append_output_footer(string $prompt): string
    {
        return rtrim($prompt) . "\n\n" . self::hard_json_footer();
    }
}
