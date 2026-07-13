<?php
namespace GSW\Core;

use GSW\Core\Mapping_Settings;
use GSW\Core\Imports;
use GSW\Core\Logs;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Registers admin menus and renders admin pages:
 * - Import configuration
 * - Imports
 * - Cron Scheduler (PRO via hook)
 * - Logs
 * - Settings (core tabs + addon tabs)
 */
class Admin
{
    public static function boot(): void
    {
        add_action( 'admin_menu', [ self::class, 'register_menus' ] );
    }

    /**
     * Capability helper: prefer WooCommerce capability, fallback to manage_options.
     */
    public static function cap(): string
    {
        return ditsgsw_manage_capability();
    }

    /**
     * Whether the Cron Scheduler UI is available.
     * - Lite: returns false by default
     * - PRO (or addon): enables via filter
     */
    protected static function can_use_cron_ui(): bool
    {
        /**
         * Allow addons (e.g. PRO) to enable Cron Scheduler UI.
         *
         * @param bool $enabled
         */
        return (bool) apply_filters( 'gsw_can_use_cron_ui', true );
    }

    public static function register_menus(): void
    {
        $cap  = self::cap();
        $slug = 'gsw-importer';

        add_menu_page(
            __( 'Products Import GSW', DITSGSW_TEXT_DOMAIN ),
            __( 'Products Import GSW', DITSGSW_TEXT_DOMAIN ),
            $cap,
            $slug,
            [ self::class, 'render_import_config' ],
            'dashicons-database-import',
            56
        );

        add_submenu_page(
            $slug,
            __( 'Import configuration', DITSGSW_TEXT_DOMAIN ),
            __( 'Import configuration', DITSGSW_TEXT_DOMAIN ),
            $cap,
            $slug,
            [ self::class, 'render_import_config' ]
        );

        add_submenu_page(
            $slug,
            __( 'Imports', DITSGSW_TEXT_DOMAIN ),
            __( 'Imports', DITSGSW_TEXT_DOMAIN ),
            $cap,
            'gsw-imports',
            [ self::class, 'render_imports' ]
        );

        // Cron page.
        add_submenu_page(
            $slug,
            __( 'Cron Scheduler', DITSGSW_TEXT_DOMAIN ),
            __( 'Cron Scheduler', DITSGSW_TEXT_DOMAIN ),
            $cap,
            'gsw-cron',
            [ self::class, 'render_cron' ]
        );

        add_submenu_page(
            $slug,
            __( 'Logs', DITSGSW_TEXT_DOMAIN ),
            __( 'Logs', DITSGSW_TEXT_DOMAIN ),
            $cap,
            'gsw-logs',
            [ self::class, 'render_logs' ]
        );

        add_submenu_page(
            $slug,
            __( 'Settings', DITSGSW_TEXT_DOMAIN ),
            __( 'Settings', DITSGSW_TEXT_DOMAIN ),
            $cap,
            'gsw-settings',
            [ self::class, 'render_settings' ]
        );
    }

    public static function render_header( string $title ): void
    {
        echo '<div class="wrap"><h1>' . esc_html( $title ) . '</h1>';
    }

    public static function render_footer(): void
    {
        echo '</div>';
    }

    public static function render_import_config(): void
    {
        self::render_header( __( 'Import configuration', DITSGSW_TEXT_DOMAIN ) );
        Mapping_Settings::render_page();
        self::render_footer();
    }

    public static function render_imports(): void
    {
        self::render_header( __( 'Imports', DITSGSW_TEXT_DOMAIN ) );
        Imports::render_page();
        self::render_footer();
    }

    public static function render_cron(): void
    {
        if ( ! self::can_use_cron_ui() ) {
            self::render_cron_lite();
            return;
        }

        self::render_header( __( 'Cron Scheduler', DITSGSW_TEXT_DOMAIN ) );

        /**
         * Let PRO (or other addons) render the Cron Scheduler UI.
         * Example: PRO can hook gsw_render_cron_page to render its page.
         */
        do_action( 'gsw_render_cron_page' );

        self::render_footer();
    }

    public static function render_logs(): void
    {
        self::render_header( __( 'Logs', DITSGSW_TEXT_DOMAIN ) );
        Logs::render_page();
        self::render_footer();
    }

    public static function render_settings(): void
    {
        self::render_header( __( 'Settings', DITSGSW_TEXT_DOMAIN ) );

        $active = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'openai';

        // Core Tabs.
        $tabs = [
            'openai'   => __( 'Open AI API', DITSGSW_TEXT_DOMAIN ),
            'google'   => __( 'Google API', DITSGSW_TEXT_DOMAIN ),
            'statuses' => __( 'Product Statuses', DITSGSW_TEXT_DOMAIN ),
            'pixabay'  => __( 'Web Image Search', DITSGSW_TEXT_DOMAIN ),
        ];

        /**
         * Allow addons (e.g. PRO) to add extra settings tabs.
         *
         * Example: PRO can add: 'license' => 'License'.
         *
         * @param array<string,string> $tabs
         */
        $tabs = apply_filters( 'gsw_settings_tabs', $tabs );

        echo '<h2 class="nav-tab-wrapper">';
        foreach ( $tabs as $key => $label ) {
            $class = $active === $key ? ' nav-tab nav-tab-active' : ' nav-tab';
            $url   = esc_url( add_query_arg( [ 'tab' => $key ] ) );
            echo '<a class="' . esc_attr( $class ) . '" href="' . $url . '">' . esc_html( $label ) . '</a>';
        }
        echo '</h2>';

        echo '<form method="post" action="options.php">';

        if ( 'openai' === $active ) {
            settings_fields( 'gsw_openai_group' );
            do_settings_sections( 'gsw_openai_page' );
        } elseif ( 'google' === $active ) {
            settings_fields( 'gsw_google_group' );
            do_settings_sections( 'gsw_google_page' );
        } elseif ( 'statuses' === $active ) {
            settings_fields( 'gsw_statuses_group' );
            do_settings_sections( 'gsw_statuses_page' );
        } elseif ( 'pixabay' === $active ) {
            settings_fields( 'gsw_pixabay_group' );
            do_settings_sections( 'gsw_pixabay_page' );
        } else {
            /**
             * Let addons render their own settings tab content.
             *
             * @param string $active_tab
             */
            do_action( 'gsw_settings_render_tab', $active );
        }

        submit_button( __( 'Save', DITSGSW_TEXT_DOMAIN ) );

        echo '</form>';

        self::render_footer();
    }

    /**
     * Lite version of the Cron Scheduler page.
     * Pure upsell block, no license checks here.
     */
    public static function render_cron_lite(): void
    {
        self::render_header( __( 'Cron Scheduler', DITSGSW_TEXT_DOMAIN ) );

        echo '<div class="notice notice-info"><p>'
            . esc_html__(
                'Cron scheduler is available in the PRO version of the plugin.',
                DITSGSW_TEXT_DOMAIN
            )
            . '</p></div>';

        echo (string) apply_filters( 'gsw_mapping_footer_action_html', '' );

        self::render_footer();
    }
}
