<?php
namespace GSW\Core;

if (!defined('ABSPATH')) exit;

/**
 * File-based logging with rotation (≤ 5MB), AJAX tail, download & clear.
 * One shared log file (global), filterable by row id.
 */
class Logs
{
    const MAX_BYTES = 5242880; // 5MB
    const DIR_SLUG  = 'gsw-importer';
    const FILE_NAME = 'import.log';
    const NONCE_KEY = 'gsw_log';

    public static function boot(): void
    {
        add_action('admin_enqueue_scripts', [self::class, 'enqueue_assets']);
        add_action('wp_ajax_gsw_fetch_log', [self::class, 'ajax_fetch_log']);
        add_action('admin_post_gsw_download_log', [self::class, 'download_log']);
        add_action('admin_post_gsw_clear_log', [self::class, 'clear_log']);
    }

    public static function enqueue_assets($hook): void
    {
        // Load only on our logs page.
        if (!isset($_GET['page']) || $_GET['page'] !== 'gsw-logs') {
            return;
        }

        wp_enqueue_style(
            'gsw-logs',
            Assets::url('gsw-core/admin/logs.css'),
            [],
            Assets::ver('gsw-core/admin/logs.css')
        );

        wp_enqueue_script(
            'gsw-logs',
            Assets::url('gsw-core/admin/logs.js'),
            ['jquery'],
            Assets::ver('gsw-core/admin/logs.js'),
            true
        );
    }

    /** Public API: write a line to log. */
    public static function write(string $rowId, string $level, string $message, array $context = []): void
    {
        $path = self::path();
        self::ensure_dir();
        self::enforce_max_size($path);

        $ts   = wp_date('Y-m-d H:i:s');
        $uid  = get_current_user_id();
        $lv   = strtoupper(preg_replace('~[^A-Z]~i', '', $level)) ?: 'INFO';

        // Build context like key=value key2=value2
        $ctx = ['row'=>$rowId, 'user'=>$uid ?: 0] + $context;
        $ctxPairs = [];
        foreach ($ctx as $k => $v) {
            if (is_scalar($v)) $ctxPairs[] = $k . '=' . str_replace(["\n","\r","|"], ' ', (string)$v);
        }
        $ctxStr = $ctxPairs ? ' | ' . implode(' ', $ctxPairs) : '';

        $line = sprintf("%s | %s | %s%s\n", $ts, $lv, str_replace(["\n","\r"], ' ', $message), $ctxStr);
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fopen
        $fh = @fopen($path, 'ab');
        if ($fh) {
            @fwrite($fh, $line);
            @fclose($fh);
        }
    }

    /** Render Logs page (UI controls + preformatted tail). */
    public static function render_page(): void
    {
        $rowId  = isset($_GET['row_id']) ? sanitize_text_field((string)$_GET['row_id']) : '';
        $limit  = isset($_GET['limit']) ? max(10, min(5000, (int)$_GET['limit'])) : 1000;

        $nonce  = wp_create_nonce(self::NONCE_KEY);
        $rows   = (array) get_option('gsw_import_configs', []);
        $path   = self::path();
        $exists = file_exists($path);

        // Initial content
        $lines = $exists ? self::tail_lines($path, $limit, $rowId) : [__('No logs yet.', DITSGSW_TEXT_DOMAIN)];

        // Controls
        ?>
        <div id="gsw-log-app" data-nonce="<?php echo esc_attr($nonce); ?>">
            <form method="get" action="">
                <input type="hidden" name="page" value="gsw-logs" />
                <table class="form-table">
                    <tr>
                        <th><label for="gsw-row-filter"><?php esc_html_e('Filter by import row', DITSGSW_TEXT_DOMAIN); ?></label></th>
                        <td>
                            <select id="gsw-row-filter" name="row_id">
                                <option value=""><?php esc_html_e('— All rows —', DITSGSW_TEXT_DOMAIN); ?></option>
                                <?php foreach ($rows as $r) :
                                    if (!is_array($r) || empty($r['id'])) continue;
                                    $id = $r['id'];
                                    $label = self::row_label($r);
                                    ?>
                                    <option value="<?php echo esc_attr($id); ?>" <?php selected($rowId, $id); ?>><?php echo esc_html($label); ?></option>
                                <?php endforeach; ?>
                            </select>
                            <p class="description"><?php esc_html_e('Shows only lines containing this row id.', DITSGSW_TEXT_DOMAIN); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="gsw-limit"><?php esc_html_e('Lines to show', DITSGSW_TEXT_DOMAIN); ?></label></th>
                        <td>
                            <input id="gsw-limit" type="number" min="10" max="5000" name="limit" value="<?php echo (int)$limit; ?>" />
                            <button class="button"><?php esc_html_e('Apply', DITSGSW_TEXT_DOMAIN); ?></button>
                            <button id="gsw-refresh" type="button" class="button"><?php esc_html_e('Refresh', DITSGSW_TEXT_DOMAIN); ?></button>
                            <label class="gsw-ml-12"><input type="checkbox" id="gsw-autoref" /> <?php esc_html_e('Auto refresh every 3s', DITSGSW_TEXT_DOMAIN); ?></label>
                        </td>
                    </tr>
                </table>
            </form>

            <p>
                <?php
                $dl = wp_nonce_url(admin_url('admin-post.php?action=gsw_download_log'), self::NONCE_KEY);
                $cl = wp_nonce_url(admin_url('admin-post.php?action=gsw_clear_log'), self::NONCE_KEY);
                ?>
                <a class="button" href="<?php echo esc_url($dl); ?>"><?php esc_html_e('Download full log', DITSGSW_TEXT_DOMAIN); ?></a>
                <a class="button button-secondary" href="<?php echo esc_url($cl); ?>" data-confirm="<?php echo esc_attr(__('Clear the log file?', DITSGSW_TEXT_DOMAIN)); ?>"><?php esc_html_e('Clear log', DITSGSW_TEXT_DOMAIN); ?></a>
                <span class="description gsw-ml-8"><?php esc_html_e('Max size: 5 MB (auto-rotates).', DITSGSW_TEXT_DOMAIN); ?></span>
            </p>

            <pre id="gsw-log" class="gsw-log-pre"><?php
                echo esc_html(implode("\n", $lines));
            ?></pre>
        </div>
        <?php
    }

    /** AJAX: return tail lines (filtered). */
    public static function ajax_fetch_log(): void
    {
        check_ajax_referer(self::NONCE_KEY);

        if (!ditsgsw_current_user_can_manage()) {
            wp_send_json_error(['message' => __('Unauthorized', DITSGSW_TEXT_DOMAIN)]);
        }

        $rowId = isset($_POST['row_id']) ? sanitize_text_field((string)$_POST['row_id']) : '';
        $limit = isset($_POST['limit']) ? max(10, min(5000, (int)$_POST['limit'])) : 1000;

        $path = self::path();
        $lines = file_exists($path) ? self::tail_lines($path, $limit, $rowId) : [__('No logs yet.', DITSGSW_TEXT_DOMAIN)];
        wp_send_json_success(['text' => implode("\n", $lines)]);
    }

    /** Download full log as text/plain. */
    public static function download_log(): void
    {
        if (!ditsgsw_current_user_can_manage()) wp_die(esc_html__('Unauthorized', DITSGSW_TEXT_DOMAIN));
        check_admin_referer(self::NONCE_KEY);

        $path = self::path();
        if (!file_exists($path)) {
            wp_die(esc_html__('No log file found.', DITSGSW_TEXT_DOMAIN));
        }

        header('Content-Type: text/plain; charset=utf-8');
        header('Content-Disposition: attachment; filename="gsw-import.log"');
        header('Content-Length: ' . filesize($path));
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_readfile_readfile
        readfile($path);
        exit;
    }

    /** Clear log (remove main and rotation), recreate empty file. */
    public static function clear_log(): void
    {
        if (!ditsgsw_current_user_can_manage()) wp_die(esc_html__('Unauthorized', DITSGSW_TEXT_DOMAIN));
        check_admin_referer(self::NONCE_KEY);

        $path = self::path();
        $rot  = $path . '.1';

        if (file_exists($path)) @unlink($path);
        if (file_exists($rot))  @unlink($rot);

        self::ensure_dir();
        // Touch new empty file
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fopen
        $fh = @fopen($path, 'wb'); if ($fh) @fclose($fh);

        wp_safe_redirect(admin_url('admin.php?page=gsw-logs'));
        exit;
    }

    /** Build a human label for row option (Category + URL short). */
    protected static function row_label(array $row): string
    {
        $cat  = (int)($row['category'] ?? 0);
        $url  = (string)($row['url'] ?? '');
        $catName = $cat && taxonomy_exists('product_cat') ? (get_term($cat, 'product_cat')->name ?? ('#'.$cat)) : __('(no category)', DITSGSW_TEXT_DOMAIN);
        $short = mb_strlen($url) > 48 ? mb_substr($url, 0, 47) . '…' : $url;
        return sprintf('%s — %s', $catName, $short);
    }

    /** Get absolute log file path in uploads/{DIR_SLUG}/import.log */
    protected static function path(): string
    {
        $up = wp_get_upload_dir();
        return trailingslashit($up['basedir']) . self::DIR_SLUG . '/' . self::FILE_NAME;
    }

    protected static function ensure_dir(): void
    {
        $up = wp_get_upload_dir();
        $dir = trailingslashit($up['basedir']) . self::DIR_SLUG;
        if (!is_dir($dir)) {
            // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
            @wp_mkdir_p($dir);
        }
    }

    /** Rotate if file exceeds MAX_BYTES (rename to .1 and start fresh). */
    protected static function enforce_max_size(string $path): void
    {
        if (file_exists($path) && filesize($path) >= self::MAX_BYTES) {
            @rename($path, $path . '.1'); // overwrite previous rotation
        }
    }

    /**
     * Tail last N lines; if $rowId provided, filter to lines containing " row=$rowId ".
     * Simple approach (file() then slice) is fine for ≤ 5MB.
     */
    protected static function tail_lines(string $path, int $lines, string $rowId = ''): array
    {
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_readfile
        $arr = @file($path, FILE_IGNORE_NEW_LINES);
        if (!is_array($arr)) return [];
        if ($rowId !== '') {
            $needle = ' row=' . $rowId;
            $arr = array_values(array_filter($arr, function($ln) use ($needle){
                return $ln !== '' && strpos($ln, $needle) !== false;
            }));
        }
        $n = count($arr);
        if ($n > $lines) $arr = array_slice($arr, $n - $lines, $lines);
        return $arr ?: [__('No matching lines.', DITSGSW_TEXT_DOMAIN)];
    }
}
