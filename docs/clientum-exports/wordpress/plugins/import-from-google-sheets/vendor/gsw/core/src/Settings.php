<?php
namespace GSW\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Registers settings & fields for:
 * - OpenAI (API key, model, prompts)
 * - Google API (service JSON, count image, max size)
 * - Product Statuses (in stock, sale, percent, waiting, sold)
 *
 */
class Settings
{
    public static function boot(): void
    {
        add_action('admin_enqueue_scripts', [ self::class, 'enqueue_assets' ]);
        add_action( 'admin_init', [ self::class, 'register_openai' ] );
        add_action( 'admin_init', [ self::class, 'register_google' ] );
        add_action( 'admin_init', [ self::class, 'register_statuses' ] );
        add_action( 'admin_init', [ self::class, 'register_pixabay' ] );
        add_filter( 'option_page_capability_gsw_openai_group',   [ self::class, 'settings_capability' ] );
        add_filter( 'option_page_capability_gsw_google_group',   [ self::class, 'settings_capability' ] );
        add_filter( 'option_page_capability_gsw_statuses_group', [ self::class, 'settings_capability' ] );
        add_filter( 'option_page_capability_gsw_pixabay_group',  [ self::class, 'settings_capability' ] );
    }

    public static function settings_capability(): string
    {
        return function_exists( 'ditsgsw_manage_capability' ) ? ditsgsw_manage_capability() : 'manage_options';
    }

    public static function enqueue_assets($hook): void
    {
        // Load only on our plugin pages (robust for different slugs/tabs).
        if (!isset($_GET['page'])) {
            return;
        }

        $page = sanitize_key((string) $_GET['page']);
        if (strpos($page, 'gsw-') !== 0 && $page !== 'gsw-importer') {
            return;
        }

        wp_enqueue_style(
            'gsw-settings',
            Assets::url('gsw-core/admin/settings.css'),
            [],
            Assets::ver('gsw-core/admin/settings.css')
        );

        wp_enqueue_script(
            'gsw-settings',
            Assets::url('gsw-core/admin/settings.js'),
            ['jquery'],
            Assets::ver('gsw-core/admin/settings.js'),
            true
        );
    }

    /** -------- OpenAI -------- */
    public static function register_openai(): void
    {
        register_setting( 'gsw_openai_group', 'gsw_openai', [
            'type'              => 'array',
            'sanitize_callback' => [ self::class, 'sanitize_openai' ],
            'default'           => get_option( 'gsw_openai', [] ),
        ] );

        // AJAX test handler
        add_action( 'wp_ajax_gsw_test_openai_api', [ self::class, 'ajax_test_openai_api' ] );

        add_settings_section(
            'gsw_openai_section',
            __( 'Open AI API', DITSGSW_TEXT_DOMAIN ),
            function () {
                echo '<p>' . esc_html__( 'Configure API key, model and prompts. You can test connectivity later.', DITSGSW_TEXT_DOMAIN ) . '</p>';
            },
            'gsw_openai_page'
        );

        add_settings_field(
            'gsw_openai_api_key',
            __( 'OpenAI API Key', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_openai_api_key' ],
            'gsw_openai_page',
            'gsw_openai_section'
        );

        add_settings_field(
            'gsw_openai_model',
            __( 'Select AI model', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_openai_model' ],
            'gsw_openai_page',
            'gsw_openai_section'
        );

        add_settings_field(
            'gsw_openai_system',
            __( 'System prompt', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_openai_system' ],
            'gsw_openai_page',
            'gsw_openai_section'
        );

        add_settings_field(
            'gsw_openai_prompt',
            __( 'Prompt', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_openai_prompt' ],
            'gsw_openai_page',
            'gsw_openai_section'
        );
        add_settings_field(
            'gsw_openai_force_regenerate_updates',
            __( 'Force text regeneration on update', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_openai_force_regenerate_updates' ],
            'gsw_openai_page',
            'gsw_openai_section'
        );
        add_settings_field(
            'gsw_openai_consent',
            __( 'Consent (required)', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_openai_consent' ],
            'gsw_openai_page',
            'gsw_openai_section'
        );

    }

    public static function sanitize_openai( $in ): array
    {
        $prev = (array) get_option( 'gsw_openai', [] );

        $api_key_in = isset( $in['api_key'] ) ? trim( (string) $in['api_key'] ) : '';
        $model_in   = isset( $in['model'] ) ? sanitize_text_field( (string) $in['model'] ) : '';

        $system_in  = isset( $in['system_prompt'] ) ? (string) $in['system_prompt'] : '';
        $prompt_in  = isset( $in['prompt'] ) ? (string) $in['prompt'] : '';

        $consent_in = ! empty( $in['consent'] ) ? 1 : 0;
        $force_regenerate_updates = ! empty( $in['force_regenerate_updates'] ) ? 1 : 0;

        // Determine if OpenAI is being configured/enabled (new or existing key, or model selected).
        $has_key_now  = ($api_key_in !== '') || ! empty( $prev['api_key'] );
        $has_model_now = ($model_in !== '') || ! empty( $prev['model'] );
        $need_consent = $has_key_now || $has_model_now;

        if ( $need_consent && ! $consent_in ) {
            add_settings_error(
                'gsw_openai',
                'gsw_openai_consent_required',
                __( 'OpenAI consent is required to enable AI content generation.', DITSGSW_TEXT_DOMAIN ),
                'error'
            );

            // Keep previous settings intact (do not wipe keys/prompts), but do not accept updates.
            // This forces user to confirm consent to change OpenAI settings.
            return $prev + [ 'consent' => (int) ( $prev['consent'] ?? 0 ) ];
        }

        return [
            // Keep previous key if input is empty (so we never need to render it back)
            'api_key'       => $api_key_in !== '' ? $api_key_in : (string) ( $prev['api_key'] ?? '' ),
            'model'         => $model_in !== '' ? $model_in : (string) ( $prev['model'] ?? '' ),

            'system_prompt' => $system_in !== '' ? wp_kses_post( $system_in ) : (string) ( $prev['system_prompt'] ?? '' ),
            'prompt'        => $prompt_in !== '' ? wp_kses_post( $prompt_in ) : (string) ( $prev['prompt'] ?? '' ),

            'force_regenerate_updates' => $force_regenerate_updates,
            'consent'       => (int) $consent_in,
        ];
    }

    public static function field_openai_api_key(): void
    {
        $opt = (array) get_option('gsw_openai', []);
        $key = (string) ($opt['api_key'] ?? '');

        $is_set = $key !== '';
        $tail   = $is_set ? substr($key, max(0, strlen($key) - 4)) : '';

        printf(
            '<input type="text" class="regular-text" name="gsw_openai[api_key]" value="" placeholder="%s" />',
            esc_attr__('Enter new key to replace (leave empty to keep current)', DITSGSW_TEXT_DOMAIN)
        );

        echo '<p class="description">';
        echo esc_html__('Required to enable AI content generation.', DITSGSW_TEXT_DOMAIN);
        echo '<br>';
        echo $is_set
            ? sprintf(
                esc_html__('Status: saved (…%s). The key is hidden and never printed in page source.', DITSGSW_TEXT_DOMAIN),
                esc_html($tail)
            )
            : esc_html__('Status: not set.', DITSGSW_TEXT_DOMAIN);
        echo '</p>';

        $nonce = wp_create_nonce(OpenAI::NONCE);

        echo '<p class="gsw-actions-row">';
        echo '<button type="button"
                class="button button-secondary js-gsw-test-api"
                data-action="gsw_test_openai_api"
                data-nonce="' . esc_attr($nonce) . '"
                data-model-selector="' . esc_attr('select[name="gsw_openai[model]"]') . '"
                data-result="#gsw-test-openai-result">'
            . esc_html__('Test OpenAI API', DITSGSW_TEXT_DOMAIN) .
            '</button> ';
        echo '<span id="gsw-test-openai-result" class="gsw-ajax-result" aria-live="polite"></span>';
        echo '</p>';
    }


    public static function field_openai_model(): void
    {
        $opt   = get_option( 'gsw_openai', [] );
        $value = $opt['model'] ?? '';

        $models = [
            ''             => __( '-- Select --', DITSGSW_TEXT_DOMAIN ),
            'gpt-3.5-turbo' => 'gpt-3.5-turbo',
            'gpt-4.1'       => 'gpt-4.1',
            'gpt-4o'        => 'gpt-4o',
            'o4-mini'       => 'o4-mini',
        ];

        echo '<select name="gsw_openai[model]">';
        foreach ( $models as $k => $label ) {
            printf(
                '<option value="%s" %s>%s</option>',
                esc_attr( $k ),
                selected( $value, $k, false ),
                esc_html( $label )
            );
        }
        echo '</select>';
    }

    public static function field_openai_system(): void
    {
        $opt   = get_option('gsw_openai', []);
        $value = (string) ($opt['system_prompt'] ?? '');

        $default = OpenAI::default_system_prompt();
        $default_json = wp_json_encode($default, JSON_UNESCAPED_UNICODE);

        printf(
            '<textarea name="gsw_openai[system_prompt]" rows="4" class="large-text" data-gsw-placeholder="%s">%s</textarea>',
            esc_attr($default_json),
            esc_textarea($value)
        );

        echo '<p class="description">' .
            esc_html__('Leave empty to use the default prompt (translated to your current WP language).', DITSGSW_TEXT_DOMAIN) .
            '</p>';
    }


    public static function field_openai_prompt(): void
    {
        $opt   = get_option('gsw_openai', []);
        $value = (string) ($opt['prompt'] ?? '');

        $default = OpenAI::default_user_prompt();
        $default_json = wp_json_encode($default, JSON_UNESCAPED_UNICODE);

        printf(
            '<textarea name="gsw_openai[prompt]" rows="6" class="large-text" data-gsw-placeholder="%s">%s</textarea>',
            esc_attr($default_json),
            esc_textarea($value)
        );

        echo '<p class="description">' .
            esc_html__('Use variables like {{title}}, {{description}}, {{status}}, {{sale_percent}}.', DITSGSW_TEXT_DOMAIN) .
            '</p>';
    }

    public static function field_openai_force_regenerate_updates(): void
    {
        $opt = (array) get_option('gsw_openai', []);
        $checked = !empty($opt['force_regenerate_updates']);

        echo '<label>';
        printf(
            '<input type="checkbox" name="gsw_openai[force_regenerate_updates]" value="1" %s /> ',
            checked($checked, true, false)
        );
        echo esc_html__(
            'Regenerate AI title, short description, and full description on every product update, even if the stock status did not change.',
            DITSGSW_TEXT_DOMAIN
        );
        echo '</label>';

        echo '<p class="description">';
        echo esc_html__(
            'Useful when you want imports to refresh existing texts together with price or availability changes.',
            DITSGSW_TEXT_DOMAIN
        );
        echo '</p>';
    }

    public static function field_openai_consent(): void
    {
        $opt     = (array) get_option('gsw_openai', []);
        $checked = ! empty( $opt['consent'] );

        echo '<label style="display:block;max-width:900px;">';
        printf(
            '<input type="checkbox" name="gsw_openai[consent]" value="1" %s required /> ',
            checked( $checked, true, false )
        );

        echo '<strong>' . esc_html__( 'I consent to sending data to OpenAI for content generation.', DITSGSW_TEXT_DOMAIN ) . '</strong>';
        echo '<br><span class="description">';
        echo esc_html__( 'When AI generation is used, the plugin may send selected product fields (e.g. title, description, attributes, categories, status, pricing context) to OpenAI servers to generate text.', DITSGSW_TEXT_DOMAIN );
        echo '</span>';
        echo '</label>';

        if ( ! $checked ) {
            echo '<p class="description" style="color:#b32d2e;margin-top:6px;">'
                . esc_html__( 'Consent is required to enable OpenAI features (including API test).', DITSGSW_TEXT_DOMAIN )
                . '</p>';
        }
    }

    public static function ajax_test_openai_api(): void
    {
        if ( ! ditsgsw_current_user_can_manage() ) {
            wp_send_json_error( [ 'message' => 'Forbidden' ], 403 );
        }

        check_ajax_referer( OpenAI::NONCE, 'nonce' );

        $opt   = (array) get_option( 'gsw_openai', [] );
        if ( empty( $opt['consent'] ) ) {
            wp_send_json_error( [ 'message' => __( 'Consent is required to test OpenAI API.', DITSGSW_TEXT_DOMAIN ) ], 400 );
        }
        $api_key = trim( (string) ( $opt['api_key'] ?? '' ) );

        $model = isset( $_POST['model'] )
            ? sanitize_text_field( wp_unslash( $_POST['model'] ) )
            : (string) ( $opt['model'] ?? '' );

        $result = OpenAI::test_connection( $api_key, $model );

        if ( ! empty( $result['ok'] ) ) {
            wp_send_json_success( [ 'message' => (string) ( $result['message'] ?? 'OK' ) ] );
        }

        wp_send_json_error( [ 'message' => (string) ( $result['message'] ?? 'OpenAI API error' ) ] );
    }



    /** -------- Google API -------- */
    public static function register_google(): void
    {
        register_setting( 'gsw_google_group', 'gsw_google', [
            'type'              => 'array',
            'sanitize_callback' => [ self::class, 'sanitize_google' ],
            'default'           => get_option( 'gsw_google', [] ),
        ] );

        add_action( 'wp_ajax_gsw_test_google_api', [ self::class, 'ajax_test_google_api' ] );

        add_settings_section(
            'gsw_google_section',
            __( 'Google API', DITSGSW_TEXT_DOMAIN ),
            function () {
                echo '<p>' . esc_html__( 'Provide a service account JSON for Google Drive access. Images must be in a shared/accessible folder.', DITSGSW_TEXT_DOMAIN ) . '</p>';
            },
            'gsw_google_page'
        );

        add_settings_field(
            'gsw_google_sa',
            __( 'Service account JSON', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_google_sa' ],
            'gsw_google_page',
            'gsw_google_section'
        );

        add_settings_field(
            'gsw_google_count',
            __( 'Count image', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_google_count' ],
            'gsw_google_page',
            'gsw_google_section'
        );

        add_settings_field(
            'gsw_google_max_file_mb',
            __( 'Max file size (MB)', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_google_max_file_mb' ],
            'gsw_google_page',
            'gsw_google_section'
        );

        add_settings_field(
            'gsw_google_formats',
            __( 'Allowed image formats', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_google_formats' ],
            'gsw_google_page',
            'gsw_google_section'
        );
        add_settings_field(
            'gsw_google_consent',
            __( 'Consent (required)', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_google_consent' ],
            'gsw_google_page',
            'gsw_google_section'
        );
    }

    public static function sanitize_google( $in ): array
    {
        $prev = (array) get_option( 'gsw_google', [] );

        $service_in = isset( $in['service_json'] ) ? trim( (string) $in['service_json'] ) : '';
        $consent_in = ! empty( $in['consent'] ) ? 1 : 0;

        $has_service_now = ($service_in !== '') || ! empty( $prev['service_json'] );
        $need_consent    = $has_service_now;

        if ( $need_consent && ! $consent_in ) {
            add_settings_error(
                'gsw_google',
                'gsw_google_consent_required',
                __( 'Google Drive consent is required to enable external image import.', DITSGSW_TEXT_DOMAIN ),
                'error'
            );

            return $prev + [ 'consent' => (int) ( $prev['consent'] ?? 0 ) ];
        }

        return [
            // Keep previous JSON if input is empty
            'service_json' => $service_in !== '' ? wp_kses_post( $service_in ) : (string) ( $prev['service_json'] ?? '' ),

            'count_image'  => isset( $in['count_image'] ) ? max( 1, (int) $in['count_image'] ) : (int) ( $prev['count_image'] ?? 5 ),
            'max_file_mb'  => isset( $in['max_file_mb'] ) ? max( 0, (float) $in['max_file_mb'] ) : (float) ( $prev['max_file_mb'] ?? 10.0 ),

            'allowed_ext'  => isset( $in['allowed_ext'] )
                ? self::normalize_ext_string( (string) $in['allowed_ext'] )
                : (string) ( $prev['allowed_ext'] ?? 'png,jpg,jpeg,webp' ),

            'consent'      => (int) $consent_in,
        ];
    }

    protected static function normalize_ext_string( string $s ): string
    {
        $s     = strtolower( $s );
        $parts = array_filter( array_map( 'trim', preg_split( '/[,\s]+/', $s ) ) );

        $parts = array_values( array_unique( array_filter( $parts, fn( $e ) => preg_match( '/^[a-z0-9]+$/', $e ) ) ) );

        if ( in_array( 'jpg', $parts, true ) && ! in_array( 'jpeg', $parts, true ) ) {
            $parts[] = 'jpeg';
        }

        if ( ! $parts ) {
            $parts = [ 'png', 'jpg', 'jpeg', 'webp' ];
        }

        return implode( ',', $parts );
    }

    public static function field_google_sa(): void
    {
        $opt  = (array) get_option('gsw_google', []);
        $json = (string) ($opt['service_json'] ?? '');

        printf(
            '<textarea name="gsw_google[service_json]" rows="6" class="large-text" placeholder="%s"></textarea>',
            esc_attr__('Paste new service account JSON to replace (leave empty to keep current)', DITSGSW_TEXT_DOMAIN)
        );

        $is_set = trim($json) !== '';
        $email  = '';

        if ($is_set) {
            $decoded = json_decode($json, true);
            if (is_array($decoded) && !empty($decoded['client_email'])) {
                $email = (string) $decoded['client_email'];
            }
        }

        echo '<p class="description">';
        echo esc_html__('Service account JSON is hidden and never printed in page source.', DITSGSW_TEXT_DOMAIN);
        echo '<br>';
        echo $is_set
            ? ($email
                ? sprintf(esc_html__('Status: saved. client_email: %s', DITSGSW_TEXT_DOMAIN), esc_html($email))
                : esc_html__('Status: saved.', DITSGSW_TEXT_DOMAIN)
            )
            : esc_html__('Status: not set.', DITSGSW_TEXT_DOMAIN);
        echo '</p>';

        $nonce = wp_create_nonce('gsw_google_test');

        echo '<p class="gsw-actions-row">';
        echo '<button type="button"
                class="button button-secondary js-gsw-test-api"
                data-action="gsw_test_google_api"
                data-nonce="' . esc_attr($nonce) . '"
                data-result="#gsw-test-google-result">'
            . esc_html__('Test Google API', DITSGSW_TEXT_DOMAIN) .
            '</button> ';
        echo '<span id="gsw-test-google-result" class="gsw-ajax-result" aria-live="polite"></span>';
        echo '</p>';
    }


    public static function field_google_count(): void
    {
        $opt = (array) get_option( 'gsw_google', [] );
        printf(
            '<input type="number" min="1" max="20" name="gsw_google[count_image]" value="%d" />',
            isset( $opt['count_image'] ) ? (int) $opt['count_image'] : 5
        );
        echo '<p class="description">' .
            esc_html__( 'How many images to fetch per product.', DITSGSW_TEXT_DOMAIN ) .
            '</p>';
    }

    public static function field_google_max_file_mb(): void
    {
        $opt = (array) get_option( 'gsw_google', [] );
        $val = isset( $opt['max_file_mb'] ) ? (float) $opt['max_file_mb'] : 10.0;

        printf(
            '<input type="number" min="0" step="0.1" name="gsw_google[max_file_mb]" value="%s" />',
            esc_attr( $val )
        );
        echo '<p class="description">' .
            esc_html__( 'Maximum image file size (in megabytes) to download. Larger files will be skipped. Set 0 for no limit.', DITSGSW_TEXT_DOMAIN ) .
            '</p>';
    }

    public static function field_google_formats(): void
    {
        $opt = (array) get_option( 'gsw_google', [] );
        $val = $opt['allowed_ext'] ?? 'png,jpg,jpeg,webp';

        printf(
            '<input type="text" name="gsw_google[allowed_ext]" class="w-360" value="%s" placeholder="png,jpg,webp" />',
            esc_attr( $val )
        );
        echo '<p class="description">' .
            esc_html__( 'Comma-separated list of allowed image extensions. Default: png, jpg, webp. Others will be ignored.', DITSGSW_TEXT_DOMAIN ) .
            '</p>';
    }

    public static function field_google_consent(): void
    {
        $opt     = (array) get_option('gsw_google', []);
        $checked = ! empty( $opt['consent'] );

        echo '<label style="display:block;max-width:900px;">';
        printf(
            '<input type="checkbox" name="gsw_google[consent]" value="1" %s required /> ',
            checked( $checked, true, false )
        );

        echo '<strong>' . esc_html__( 'I consent to accessing Google Drive sources and downloading content for import.', DITSGSW_TEXT_DOMAIN ) . '</strong>';
        echo '<br><span class="description">';
        echo esc_html__( 'When Google Drive import is used, the plugin may request and download images/files from Google Drive as an external source (shared folders/files you provide access to).', DITSGSW_TEXT_DOMAIN );
        echo '</span>';
        echo '</label>';

        if ( ! $checked ) {
            echo '<p class="description" style="color:#b32d2e;margin-top:6px;">'
                . esc_html__( 'Consent is required to enable Google Drive import features (including API test).', DITSGSW_TEXT_DOMAIN )
                . '</p>';
        }
    }

    public static function ajax_test_google_api(): void
    {
        if ( ! ditsgsw_current_user_can_manage() ) {
            wp_send_json_error( [ 'message' => 'Forbidden' ], 403 );
        }

        check_ajax_referer( 'gsw_google_test', 'nonce' );

        if ( ! class_exists( \Google\Client::class ) && ! class_exists( 'Google_Client' ) ) {
            wp_send_json_error( [ 'message' => 'google/apiclient not installed (composer)' ] );
        }
        $opt = (array) get_option( 'gsw_google', [] );

        if ( empty( $opt['consent'] ) ) {
            wp_send_json_error( [ 'message' => __( 'Consent is required to test Google API.', DITSGSW_TEXT_DOMAIN ) ], 400 );
        }

        try {
            $service = Image_Import::build_drive_service( 'admin-test' );
            if ( ! $service ) {
                wp_send_json_error( [ 'message' => 'Client not initialized. Check service account JSON.' ] );
            }

            $about = $service->about->get( [ 'fields' => 'user,storageQuota' ] );
            $email = '';

            if ( method_exists( $about, 'getUser' ) && $about->getUser() ) {
                $user  = $about->getUser();
                $email = method_exists( $user, 'getEmailAddress' ) ? (string) $user->getEmailAddress() : '';
            }

            $msg = $email
                ? sprintf( __( 'Google Drive connected as %s', DITSGSW_TEXT_DOMAIN ), esc_html( $email ) )
                : __( 'Google Drive connected', DITSGSW_TEXT_DOMAIN );

            wp_send_json_success( [ 'message' => $msg ] );
        } catch ( \Throwable $e ) {
            wp_send_json_error( [ 'message' => 'Google API error: ' . $e->getMessage() ] );
        }
    }

    /** -------- Product Statuses -------- */
    public static function register_statuses(): void
    {
        register_setting( 'gsw_statuses_group', 'gsw_statuses', [
            'type'              => 'array',
            'sanitize_callback' => [ self::class, 'sanitize_statuses' ],
            'default'           => get_option( 'gsw_statuses', [] ),
        ] );

        add_settings_section(
            'gsw_statuses_section',
            __( 'Product Statuses', DITSGSW_TEXT_DOMAIN ),
            function () {
                echo '<p>' . esc_html__( 'Comma-separated synonyms for each status in your feed language.', DITSGSW_TEXT_DOMAIN ) . '</p>';
            },
            'gsw_statuses_page'
        );

        add_settings_field(
            'gsw_statuses_in_stock',
            __( 'In stock', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_status_in_stock' ],
            'gsw_statuses_page',
            'gsw_statuses_section'
        );

        add_settings_field(
            'gsw_statuses_sale',
            __( 'Sale', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_status_sale' ],
            'gsw_statuses_page',
            'gsw_statuses_section'
        );

        add_settings_field(
            'gsw_statuses_sale_percent',
            __( 'Sale percent', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_status_sale_percent' ],
            'gsw_statuses_page',
            'gsw_statuses_section'
        );

        add_settings_field(
            'gsw_statuses_waiting',
            __( 'Waiting', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_status_waiting' ],
            'gsw_statuses_page',
            'gsw_statuses_section'
        );

        add_settings_field(
            'gsw_statuses_sold',
            __( 'Sold', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_status_sold' ],
            'gsw_statuses_page',
            'gsw_statuses_section'
        );
    }

    public static function sanitize_statuses( $in ): array
    {
        $out = [
            'in_stock'     => isset( $in['in_stock'] ) ? sanitize_textarea_field( $in['in_stock'] ) : '',
            'sale'         => isset( $in['sale'] ) ? sanitize_textarea_field( $in['sale'] ) : '',
            'sale_percent' => isset( $in['sale_percent'] ) ? max( 0, min( 90, (int) $in['sale_percent'] ) ) : 10,
            'waiting'      => isset( $in['waiting'] ) ? sanitize_textarea_field( $in['waiting'] ) : '',
            'sold'         => isset( $in['sold'] ) ? sanitize_textarea_field( $in['sold'] ) : '',
        ];

        return $out;
    }

    public static function field_status_in_stock(): void
    {
        $opt = get_option( 'gsw_statuses', [] );
        printf(
            '<input type="text" class="regular-text" name="gsw_statuses[in_stock]" value="%s" />',
            esc_attr( $opt['in_stock'] ?? '' )
        );
        echo '<p class="description">' .
            esc_html__( 'Comma-separated values, e.g. "В наличии, in stock, на складе".', DITSGSW_TEXT_DOMAIN ) .
            '</p>';
    }

    public static function field_status_sale(): void
    {
        $opt = get_option( 'gsw_statuses', [] );
        printf(
            '<input type="text" class="regular-text" name="gsw_statuses[sale]" value="%s" />',
            esc_attr( $opt['sale'] ?? '' )
        );
    }

    public static function field_status_sale_percent(): void
    {
        $opt = get_option( 'gsw_statuses', [] );
        printf(
            '<input type="number" min="0" max="90" name="gsw_statuses[sale_percent]" value="%d" />',
            isset( $opt['sale_percent'] ) ? (int) $opt['sale_percent'] : 10
        );
        echo '<p class="description">' .
            esc_html__( 'Percent to increase the crossed-out regular price when status is "Sale".', DITSGSW_TEXT_DOMAIN ) .
            '</p>';
    }

    public static function field_status_waiting(): void
    {
        $opt = get_option( 'gsw_statuses', [] );
        printf(
            '<input type="text" class="regular-text" name="gsw_statuses[waiting]" value="%s" />',
            esc_attr( $opt['waiting'] ?? '' )
        );
    }

    public static function field_status_sold(): void
    {
        $opt = get_option( 'gsw_statuses', [] );
        printf(
            '<input type="text" class="regular-text" name="gsw_statuses[sold]" value="%s" />',
            esc_attr( $opt['sold'] ?? '' )
        );
    }

    // =========================================================================
    // Web Image Search (Pixabay)
    // =========================================================================

    public static function register_pixabay(): void
    {
        register_setting( 'gsw_pixabay_group', Web_Image_Search::OPT, [
            'type'              => 'array',
            'sanitize_callback' => [ self::class, 'sanitize_pixabay' ],
            'default'           => get_option( Web_Image_Search::OPT, [] ),
        ] );

        add_action( 'wp_ajax_gsw_test_pixabay_api', [ self::class, 'ajax_test_pixabay_api' ] );

        add_settings_section(
            'gsw_pixabay_section',
            __( 'Web Image Search — Pixabay', DITSGSW_TEXT_DOMAIN ),
            static function () {
                echo '<p>' . wp_kses(
                    __( 'Automatically fetch a product image from the web when no Google Drive folder is provided.<br>Get a free API key (no credit card) at <a href="https://pixabay.com/api/docs/" target="_blank" rel="noopener noreferrer">pixabay.com/api/docs</a>. Free tier: 100 requests/hour.', DITSGSW_TEXT_DOMAIN ),
                    [ 'a' => [ 'href' => [], 'target' => [], 'rel' => [] ], 'br' => [] ]
                ) . '</p>';
            },
            'gsw_pixabay_page'
        );

        add_settings_field(
            'gsw_pixabay_api_key',
            __( 'Pixabay API Key', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_pixabay_api_key' ],
            'gsw_pixabay_page',
            'gsw_pixabay_section'
        );

        add_settings_field(
            'gsw_pixabay_consent',
            __( 'Consent (required)', DITSGSW_TEXT_DOMAIN ),
            [ self::class, 'field_pixabay_consent' ],
            'gsw_pixabay_page',
            'gsw_pixabay_section'
        );
    }

    public static function sanitize_pixabay( $in ): array
    {
        $prev       = (array) get_option( Web_Image_Search::OPT, [] );
        $key_in     = isset( $in['api_key'] ) ? trim( (string) $in['api_key'] ) : '';
        $consent_in = ! empty( $in['consent'] ) ? 1 : 0;

        $has_key_now  = $key_in !== '' || ! empty( $prev['api_key'] );
        $need_consent = $has_key_now;

        if ( $need_consent && ! $consent_in ) {
            add_settings_error(
                Web_Image_Search::OPT,
                'gsw_pixabay_consent_required',
                __( 'Pixabay consent is required to enable Web Image Search.', DITSGSW_TEXT_DOMAIN ),
                'error'
            );
            return $prev + [ 'consent' => (int) ( $prev['consent'] ?? 0 ) ];
        }

        return [
            'api_key' => $key_in !== '' ? $key_in : (string) ( $prev['api_key'] ?? '' ),
            'consent' => (int) $consent_in,
        ];
    }

    public static function field_pixabay_api_key(): void
    {
        $opt    = (array) get_option( Web_Image_Search::OPT, [] );
        $key    = (string) ( $opt['api_key'] ?? '' );
        $is_set = $key !== '';
        $tail   = $is_set ? '…' . substr( $key, max( 0, strlen( $key ) - 4 ) ) : '';

        printf(
            '<input type="text" class="regular-text" name="%s[api_key]" value="" placeholder="%s" />',
            esc_attr( Web_Image_Search::OPT ),
            esc_attr__( 'Enter new key to replace (leave empty to keep current)', DITSGSW_TEXT_DOMAIN )
        );

        echo '<p class="description">';
        echo $is_set
            ? sprintf( esc_html__( 'Status: saved (%s). Key is never printed in page source.', DITSGSW_TEXT_DOMAIN ), esc_html( $tail ) )
            : esc_html__( 'Status: not set.', DITSGSW_TEXT_DOMAIN );
        echo '</p>';

        $nonce = wp_create_nonce( Web_Image_Search::NONCE );

        echo '<p class="gsw-actions-row">';
        echo '<button type="button"
                class="button button-secondary js-gsw-test-api"
                data-action="gsw_test_pixabay_api"
                data-nonce="' . esc_attr( $nonce ) . '"
                data-result="#gsw-test-pixabay-result">'
            . esc_html__( 'Test Pixabay API', DITSGSW_TEXT_DOMAIN ) .
            '</button> ';
        echo '<span id="gsw-test-pixabay-result" class="gsw-ajax-result" aria-live="polite"></span>';
        echo '</p>';
    }

    public static function field_pixabay_consent(): void
    {
        $opt     = (array) get_option( Web_Image_Search::OPT, [] );
        $checked = ! empty( $opt['consent'] );

        echo '<label style="display:block;max-width:900px;">';
        printf(
            '<input type="checkbox" name="%s[consent]" value="1" %s required /> ',
            esc_attr( Web_Image_Search::OPT ),
            checked( $checked, true, false )
        );

        echo '<strong>' . esc_html__( 'I consent to sending product titles to Pixabay to search for matching images.', DITSGSW_TEXT_DOMAIN ) . '</strong>';
        echo '<br><span class="description">';
        echo esc_html__( 'When Web Image Search is used, the plugin sends the product title as a search query to Pixabay servers to find a relevant image. No personal data is shared.', DITSGSW_TEXT_DOMAIN );
        echo '</span>';
        echo '</label>';

        if ( ! $checked ) {
            echo '<p class="description" style="color:#b32d2e;margin-top:6px;">'
                . esc_html__( 'Consent is required to enable Web Image Search (including API test).', DITSGSW_TEXT_DOMAIN )
                . '</p>';
        }
    }

    public static function ajax_test_pixabay_api(): void
    {
        if ( ! ditsgsw_current_user_can_manage() ) {
            wp_send_json_error( [ 'message' => 'Forbidden' ], 403 );
        }

        check_ajax_referer( Web_Image_Search::NONCE, 'nonce' );

        $opt = (array) get_option( Web_Image_Search::OPT, [] );
        if ( empty( $opt['consent'] ) ) {
            wp_send_json_error( [ 'message' => __( 'Consent is required to test Pixabay API.', DITSGSW_TEXT_DOMAIN ) ], 400 );
        }

        $api_key = trim( (string) ( $opt['api_key'] ?? '' ) );
        $result  = Web_Image_Search::test_connection( $api_key );

        if ( ! empty( $result['ok'] ) ) {
            wp_send_json_success( [ 'message' => (string) ( $result['message'] ?? 'OK' ) ] );
        }

        wp_send_json_error( [ 'message' => (string) ( $result['message'] ?? 'Pixabay API error' ) ] );
    }
}
