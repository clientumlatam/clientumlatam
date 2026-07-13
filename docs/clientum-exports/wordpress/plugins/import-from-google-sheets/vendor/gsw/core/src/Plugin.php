<?php
namespace GSW\Core;

if (!defined('ABSPATH')) exit;

/**
 * Core plugin bootstrap. Wires classes together.
 */
final class Plugin
{
    private static ?Plugin $instance = null;

    public static function instance(): Plugin
    {
        if (!self::$instance) self::$instance = new self();
        return self::$instance;
    }

    private function __construct()
    {
        // Boot sub-systems.
        Admin::boot();
        Settings::boot();
        Mapping_Settings::boot();
        Imports::boot();
        Logs::boot();
        OpenAI::boot();
        Cron_Scheduler::boot();
    }

    /**
     * Called on plugin activation.
     * - Pre-populate default options.
     * - Setup cron intervals (later).
     */
    public static function activate(): void
    {
        // Default options (safe if already exist).
        add_option('gsw_import_configs', []); // array of rows for Import configuration
        add_option('gsw_openai', [
            'api_key'       => '',
            'model'         => '',
            'system_prompt' => '',
            'prompt'        => '',
            'force_regenerate_updates' => 0,
        ]);
        add_option('gsw_google', [
            'service_json' => '',
            'count_image'  => 5,
            'max_size'     => 2000, 
        ]);
        add_option('gsw_statuses', [
            'in_stock'     => 'in stock',
            'sale'         => 'Sale',
            'sale_percent' => 10,
            'waiting'      => 'waiting',
            'sold'         => 'Sold,out of stock',
        ]);

        add_option( Web_Image_Search::OPT, [
            'api_key' => '',
            'consent' => 0,
        ] );

        // state storage
        if (false === get_option('gsw_import_state', false)) {
            add_option('gsw_import_state', []); // keyed by row id
        }
    }

    /**
     * Runs on plugin deactivation.
     */
    public static function deactivate(): void
    {
        
    }
}
