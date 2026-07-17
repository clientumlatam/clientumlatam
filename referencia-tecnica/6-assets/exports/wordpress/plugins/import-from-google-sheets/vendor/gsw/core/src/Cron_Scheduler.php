<?php
namespace GSW\Core;

if (!defined('ABSPATH')) exit;

/**
 * FREE Cron Scheduler UI + persistence.
 *
 * Constraint: one active scheduled plan per import row.
 * We rely on wp_next_scheduled/wp_clear_scheduled_hook with args=[ $row_id ] for the next run.
 */
class Cron_Scheduler
{
    const OPT = 'gsw_import_schedules';

    // Re-schedule next run after each finished import.
    public static function boot(): void
    {
        add_action('admin_post_gsw_add_schedule', [self::class, 'handle_add_schedule']);
        add_action('admin_post_gsw_cancel_schedule', [self::class, 'handle_cancel_schedule']);

        add_action('gsw_render_cron_page', [self::class, 'render_page']);

        // Called by Imports::finish_job() after the job completes.
        add_action('gsw_import_finished', [self::class, 'on_import_finished'], 10, 4);
    }


    protected static function cap(): bool
    {
        return function_exists('ditsgsw_current_user_can_manage') ? ditsgsw_current_user_can_manage() : current_user_can('manage_options');
    }

    protected static function get_schedules(): array
    {
        $raw = get_option(self::OPT, []);
        return is_array($raw) ? $raw : [];
    }

    protected static function set_schedules(array $schedules): void
    {
        update_option(self::OPT, $schedules, false);
    }

    /** Normalize stored schedule entry list. */
    protected static function normalize(array $schedules): array
    {
        $out = [];
        foreach ($schedules as $entry) {
            if (!is_array($entry)) continue;
            $row_id = isset($entry['row_id']) ? (string)$entry['row_id'] : '';
            if ($row_id === '') continue;
            $timestamp = isset($entry['timestamp']) ? (int)$entry['timestamp'] : 0;
            if ($timestamp <= 0) continue;
            $id = isset($entry['id']) ? (string)$entry['id'] : '';
            if ($id === '') continue;

            $frequency = isset($entry['frequency']) ? sanitize_text_field((string)$entry['frequency']) : '';
            $frequency = self::sanitize_frequency($frequency);

            $out[] = [
                'id' => $id,
                'row_id' => $row_id,
                'timestamp' => $timestamp,
                'frequency' => $frequency,
                'created' => isset($entry['created']) ? (int)$entry['created'] : time(),
                'status' => isset($entry['status']) ? sanitize_text_field((string)$entry['status']) : 'scheduled',
            ];
        }
        return $out;
    }

    protected static function sanitize_frequency(string $frequency): string
    {
        $allowed = [
            '5m' => '5m',
            '30m' => '30m',
            '1h' => '1h',
            '3h' => '3h',
            '6h' => '6h',
            '12h' => '12h',
            'daily' => 'daily',
            'weekly' => 'weekly',
        ];
        return isset($allowed[$frequency]) ? $allowed[$frequency] : '';
    }

    protected static function frequency_to_seconds(string $frequency): int
    {
        return match ($frequency) {
            '5m' => 5 * 60,
            '30m' => 30 * 60,
            '1h' => 60 * 60,
            '3h' => 3 * 60 * 60,
            '6h' => 6 * 60 * 60,
            '12h' => 12 * 60 * 60,
            'daily' => 24 * 60 * 60,
            'weekly' => 7 * 24 * 60 * 60,
            default => 0,
        };
    }

    /**
     * Re-schedule next run after each import row job finishes.
     * Args: (string $row_id, string $jobKey, bool $success, string $message)
     */
    public static function on_import_finished(string $row_id, string $jobKey, bool $success, string $message): void
    {
        // Only continue if we have an active schedule plan for this row.
        $sched = self::schedule_for_row($row_id);
        if (!$sched || empty($sched['frequency'])) {
            return;
        }

        $frequency = self::sanitize_frequency((string)$sched['frequency']);
        if ($frequency === '') {
            return;
        }

        $seconds = self::frequency_to_seconds($frequency);
        if ($seconds <= 0) {
            return;
        }

        // Schedule next run.
        $next_ts = time() + $seconds;

        // Guard: ensure only one next schedule exists.
        wp_clear_scheduled_hook(Imports::HOOK_RUN, [$row_id]);
        wp_schedule_single_event($next_ts, Imports::HOOK_RUN, [$row_id]);

        // Persist updated timestamp.
        $schedules = self::get_schedules();
        foreach ($schedules as &$e) {
            if (is_array($e) && isset($e['row_id']) && (string)$e['row_id'] === $row_id) {
                $e['timestamp'] = (int)$next_ts;
                // keep frequency/id
                break;
            }
        }
        unset($e);
        self::set_schedules(self::normalize($schedules));
    }




    /** Return schedule entry for a row if any (only one). */
    protected static function schedule_for_row(string $row_id): ?array
    {
        foreach (self::get_schedules() as $entry) {
            if (isset($entry['row_id']) && (string)$entry['row_id'] === $row_id) {
                return $entry;
            }
        }
        return null;
    }

    protected static function remove_schedule_for_row(string $row_id): void
    {
        $all = self::get_schedules();
        $new = [];
        foreach ($all as $entry) {
            if (!is_array($entry)) continue;
            if (isset($entry['row_id']) && (string)$entry['row_id'] === $row_id) {
                continue;
            }
            $new[] = $entry;
        }
        self::set_schedules($new);
    }

    protected static function format_datetime_local(int $timestamp): string
    {
        // Use WP timezone.
        $dt = new \DateTime('@' . $timestamp);
        $tz = wp_timezone();
        if ($tz instanceof \DateTimeZone) {
            $dt->setTimezone($tz);
        }
        return $dt->format('Y-m-d H:i');
    }

    protected static function datetime_local_to_timestamp(string $datetime_local): ?int
    {
        $datetime_local = trim($datetime_local);
        if ($datetime_local === '') return null;

        // Expected format: YYYY-MM-DDTHH:MM (from datetime-local)
        $normalized = str_replace('T', ' ', $datetime_local);
        $ts = strtotime($normalized);
        if (!is_int($ts) && $ts !== false) {
            $ts = (int)$ts;
        }
        if ($ts === false || $ts <= 0) return null;
        return $ts;
    }

    public static function render_page(): void
    {
        if (!self::cap()) {
            echo '<div class="notice notice-error"><p>' . esc_html__('Unauthorized', 'import-products-from-google-sheets-for-woocommerce') . '</p></div>';
            return;
        }

        $configs = (array)get_option('gsw_import_configs', []);

        echo '<h2>' . esc_html__('Cron Scheduler (FREE)', 'import-products-from-google-sheets-for-woocommerce') . '</h2>';
        echo '<p class="description">' . esc_html__('Schedule imports to run at a chosen date/time. Free version supports one scheduled run per import row.', 'import-products-from-google-sheets-for-woocommerce') . '</p>';

        $schedules = self::get_schedules();
        // Build quick lookup
        $by_row = [];
        foreach ($schedules as $e) {
            if (!is_array($e) || empty($e['row_id']) || empty($e['id']) || empty($e['timestamp'])) continue;
            $by_row[(string)$e['row_id']] = $e;
        }

        echo '<table class="widefat striped"><thead><tr>';
        echo '<th>' . esc_html__('Row', 'import-products-from-google-sheets-for-woocommerce') . '</th>';
        echo '<th>' . esc_html__('Category', 'import-products-from-google-sheets-for-woocommerce') . '</th>';
        echo '<th>' . esc_html__('Scheduled', 'import-products-from-google-sheets-for-woocommerce') . '</th>';
        echo '<th>' . esc_html__('Actions', 'import-products-from-google-sheets-for-woocommerce') . '</th>';
        echo '</tr></thead><tbody>';

        if (empty($configs)) {
            echo '<tr><td colspan="4">' . esc_html__('No import rows. Add rows in Import configuration.', 'import-products-from-google-sheets-for-woocommerce') . '</td></tr>';
        } else {
            foreach ($configs as $cfg) {
                if (!is_array($cfg) || empty($cfg['id'])) continue;
                $row_id = (string)$cfg['id'];
                $cat_id = (int)($cfg['category'] ?? 0);
                $cat_name = '';
                if (taxonomy_exists('product_cat') && $cat_id) {
                    $term = get_term($cat_id, 'product_cat');
                    if ($term && !is_wp_error($term)) $cat_name = (string)$term->name;
                }
                $sched = $by_row[$row_id] ?? null;
                $when = $sched && !empty($sched['timestamp']) ? self::format_datetime_local((int)$sched['timestamp']) : '—';
                $has = (bool)$sched;

                echo '<tr>';
                echo '<td>' . esc_html($row_id) . '</td>';
                echo '<td>' . ($cat_name ? esc_html($cat_name) : '—') . '</td>';
                echo '<td>' . esc_html($when) . '</td>';

                echo '<td>';
                if ($has) {
                    $cancel_url = wp_nonce_url(
                        admin_url('admin-post.php?action=gsw_cancel_schedule&row_id=' . rawurlencode($row_id)),
                        'gsw_cancel_schedule_' . $row_id
                    );
                    echo '<a class="button button-secondary" href="' . esc_url($cancel_url) . '" onclick="return confirm(\'' . esc_js(__( 'Cancel scheduled import?', 'import-products-from-google-sheets-for-woocommerce' )) . '\');">' . esc_html__( 'Cancel', 'import-products-from-google-sheets-for-woocommerce' ) . '</a>';
                } else {
                    echo '<span class="description">' . esc_html__( 'Not scheduled', 'import-products-from-google-sheets-for-woocommerce' ) . '</span>';
                }
                echo '</td>';

                echo '</tr>';
            }
        }

        echo '</tbody></table>';

        echo '<hr/>';

        // Add form
        echo '<h3>' . esc_html__('Add schedule', 'import-products-from-google-sheets-for-woocommerce') . '</h3>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">' ;
        wp_nonce_field('gsw_add_schedule_form', 'gsw_add_schedule_form_nonce');
        echo '<input type="hidden" name="action" value="gsw_add_schedule" />';

        echo '<p><label>' . esc_html__('Select import row', 'import-products-from-google-sheets-for-woocommerce') . '<br/>';
        echo '<select name="row_id" required style="min-width:360px">';
        foreach ($configs as $cfg) {
            if (!is_array($cfg) || empty($cfg['id'])) continue;
            $row_id = (string)$cfg['id'];
            $label = $row_id;
            $cat_id = (int)($cfg['category'] ?? 0);
            if ($cat_id && taxonomy_exists('product_cat')) {
                $term = get_term($cat_id, 'product_cat');
                if ($term && !is_wp_error($term)) $label = sprintf('%s — %s', $row_id, (string)$term->name);
            }
            echo '<option value="' . esc_attr($row_id) . '">' . esc_html($label) . '</option>';
        }
        echo '</select></label></p>';

        echo '<p><label>' . esc_html__('First run at (WP timezone)', 'import-products-from-google-sheets-for-woocommerce') . '<br/>';
        echo '<input type="datetime-local" name="run_at" required style="min-width:240px" /></label></p>';

        echo '<p><label>' . esc_html__('Frequency', 'import-products-from-google-sheets-for-woocommerce') . '<br/>';
        echo '<select name="frequency" required style="min-width:260px">';

        $freqs = [
            '5m' => 'Every 5 minutes',
            '30m' => 'Every 30 minutes',
            '1h' => 'Every 1 hour',
            '3h' => 'Every 3 hours',
            '6h' => 'Every 6 hours',
            '12h' => 'Every 12 hours',
            'daily' => 'Once per day',
            'weekly' => 'Once per week',
        ];
        foreach ($freqs as $k => $label) {
            echo '<option value="' . esc_attr($k) . '">' . esc_html($label) . '</option>';
        }
        echo '</select></label></p>';

        submit_button(__( 'Schedule import', 'import-products-from-google-sheets-for-woocommerce' ));


        echo '</form>';
    }

    public static function handle_add_schedule(): void
    {
        if (!self::cap()) wp_die(esc_html__( 'Unauthorized', 'import-products-from-google-sheets-for-woocommerce' ));

        $row_id = isset($_POST['row_id']) ? sanitize_text_field((string)$_POST['row_id']) : '';
        $run_at = isset($_POST['run_at']) ? (string)$_POST['run_at'] : '';
        $frequency = isset($_POST['frequency']) ? sanitize_text_field((string)$_POST['frequency']) : '';

        if (empty($row_id) || empty($run_at) || empty($frequency)) {
            wp_die(esc_html__( 'Bad request', 'import-products-from-google-sheets-for-woocommerce' ));
        }

        if (!isset($_POST['gsw_add_schedule_form_nonce']) || !wp_verify_nonce($_POST['gsw_add_schedule_form_nonce'], 'gsw_add_schedule_form')) {
            wp_die(esc_html__( 'Bad nonce', 'import-products-from-google-sheets-for-woocommerce' ));
        }

        $timestamp = self::datetime_local_to_timestamp($run_at);
        if (!$timestamp || $timestamp <= time()) {
            set_transient('gsw_notice_' . get_current_user_id(), 'error|' . esc_html__( 'First run time must be in the future.', 'import-products-from-google-sheets-for-woocommerce' ), 90);
            wp_safe_redirect(admin_url('admin.php?page=gsw-cron'));
            exit;
        }

        $frequency = self::sanitize_frequency($frequency);
        if ($frequency === '') {
            wp_die(esc_html__( 'Bad frequency', 'import-products-from-google-sheets-for-woocommerce' ));
        }

        // Cancel existing schedule for this row (one active per row)

        $existing = self::schedule_for_row($row_id);
        if ($existing && !empty($existing['timestamp'])) {
            // Clear next scheduled event
            wp_clear_scheduled_hook(Imports::HOOK_RUN, [$row_id]);
            self::remove_schedule_for_row($row_id);
        } else {
            // Ensure no stray events
            wp_clear_scheduled_hook(Imports::HOOK_RUN, [$row_id]);
            self::remove_schedule_for_row($row_id);
        }

        $id = 'gswsch_' . wp_generate_uuid4();

        $schedules = self::get_schedules();
        $schedules[] = [
            'id' => $id,
            'row_id' => $row_id,
            'timestamp' => (int)$timestamp,
            'frequency' => (string)$frequency,
            'created' => time(),
            'status' => 'scheduled',
        ];

        self::set_schedules(self::normalize($schedules));

        wp_schedule_single_event($timestamp, Imports::HOOK_RUN, [$row_id]);

        set_transient('gsw_notice_' . get_current_user_id(), 'success|' . esc_html__( 'Import scheduled.', 'import-products-from-google-sheets-for-woocommerce' ), 60);
        wp_safe_redirect(admin_url('admin.php?page=gsw-cron'));
        exit;
    }

    public static function handle_cancel_schedule(): void
    {
        if (!self::cap()) wp_die(esc_html__( 'Unauthorized', 'import-products-from-google-sheets-for-woocommerce' ));

        $row_id = isset($_GET['row_id']) ? sanitize_text_field((string)$_GET['row_id']) : '';
        if (empty($row_id)) wp_die(esc_html__( 'Bad request', 'import-products-from-google-sheets-for-woocommerce' ));
        if (!check_admin_referer('gsw_cancel_schedule_' . $row_id)) {
            wp_die(esc_html__( 'Bad request', 'import-products-from-google-sheets-for-woocommerce' ));
        }

        wp_clear_scheduled_hook(Imports::HOOK_RUN, [$row_id]);
        self::remove_schedule_for_row($row_id);

        set_transient('gsw_notice_' . get_current_user_id(), 'success|' . esc_html__( 'Scheduled import cancelled.', 'import-products-from-google-sheets-for-woocommerce' ), 60);
        wp_safe_redirect(admin_url('admin.php?page=gsw-cron'));
        exit;
    }
}

