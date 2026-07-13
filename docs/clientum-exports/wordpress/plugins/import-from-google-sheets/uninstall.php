<?php
/**
 * Uninstall cleanup for Google Sheets to WooCommerce Importer
 *
 * NOTE: Keep this file minimal and safe. It runs with full privileges.
 */
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

function ditsgsw_uninstall_cleanup(): void
{
    // Delete plugin options (single site + multisite)
    $option_keys = [
        'gsw_import_configs',
        'gsw_import_state',
        'gsw_cron_rules',
        'gsw_google',
        'gsw_openai',
        'gsw_statuses',
        'gsw_active_jobs',
    ];

    foreach ($option_keys as $key) {
        delete_option($key);
        delete_site_option($key);
    }

    // Remove scheduled hooks (all events for these hooks)
    if (function_exists('wp_unschedule_hook')) {
        wp_unschedule_hook('gsw_run_import');
        wp_unschedule_hook('gsw_process_batch');
    } elseif (function_exists('wp_clear_scheduled_hook')) {
        // Fallback for older WP installs
        wp_clear_scheduled_hook('gsw_run_import');
        wp_clear_scheduled_hook('gsw_process_batch');
    }

    // Remove uploads directory (logs/jobs)
    $upload_dir = wp_upload_dir(null, false);
    $target_dir = trailingslashit($upload_dir['basedir']) . 'gsw-importer';

    if (!is_dir($target_dir)) {
        return;
    }

    // Use WP_Filesystem for file operations (required by WP coding standards tools)
    if (!function_exists('WP_Filesystem')) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
    }

    $fs_ready = WP_Filesystem();
    global $wp_filesystem;

    if (!$fs_ready || !is_object($wp_filesystem)) {
        // If filesystem API is not available, we prefer to skip deletion
        // rather than using direct PHP filesystem calls.
        return;
    }

    if ($wp_filesystem->is_dir($target_dir)) {
        // Recursive delete
        $wp_filesystem->rmdir($target_dir, true);
    }
}

ditsgsw_uninstall_cleanup();
