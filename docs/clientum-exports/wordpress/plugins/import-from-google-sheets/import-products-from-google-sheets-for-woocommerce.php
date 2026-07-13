<?php
/**
 * Plugin Name:       AI Import Products from Google Sheets for WooCommerce
 * Description:       Import WooCommerce products from Google Sheets or CSV with flexible field mapping, safe batch processing, optional image sync, and AI-powered content generation.
 * Version:           1.0.6
 * Author:            Dits
 * Text Domain:       import-products-from-google-sheets-for-woocommerce
 * Domain Path:       /languages
 * Requires at least: 6.3
 * Tested up to:      7.0
 * Requires PHP:      8.1
 * Requires Plugins:  woocommerce
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 */


if (!defined('ABSPATH')) exit;

if ( ! defined( 'DITSGSW_TEXT_DOMAIN' ) ) {
    define( 'DITSGSW_TEXT_DOMAIN', 'import-products-from-google-sheets-for-woocommerce' );
}

// If PRO is active, don't boot FREE to avoid duplicates/conflicts.
if ( defined( 'DITSGSW_PRO_PLUGIN_FILE' ) ) {

    // Optional: auto-deactivate FREE in admin (so it won't stay active "silently")
    add_action( 'admin_init', static function () {
        if ( ! current_user_can( 'activate_plugins' ) ) {
            return;
        }
        if ( ! function_exists( 'deactivate_plugins' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        deactivate_plugins( plugin_basename( __FILE__ ), true );
        set_transient( 'ditsgsw_free_disabled_by_pro', 1, 60 );
    } );

    add_action( 'admin_notices', static function () {
        if ( get_transient( 'ditsgsw_free_disabled_by_pro' ) ) {
            delete_transient( 'ditsgsw_free_disabled_by_pro' );
        }
        echo '<div class="notice notice-info is-dismissible"><p>'
            . esc_html__( 'PRO version is active. Free plugin is disabled to avoid conflicts.', 'import-products-from-google-sheets-for-woocommerce' )
            . '</p></div>';
    } );

    return;
}

if ( ! defined( 'DITSGSW_PLUGIN_FILE' ) ) {
    define( 'DITSGSW_PLUGIN_FILE', __FILE__ );
}
if ( ! defined( 'DITSGSW_PLUGIN_DIR' ) ) {
    define( 'DITSGSW_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}
if ( ! defined( 'DITSGSW_PLUGIN_URL' ) ) {
    define( 'DITSGSW_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
}
if ( ! defined( 'DITSGSW_VERSION' ) ) {
    define( 'DITSGSW_VERSION', '1.0.6' );
}

// Optional: load Composer if you decide to use it later.
if ( file_exists( DITSGSW_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
    require_once DITSGSW_PLUGIN_DIR . 'vendor/autoload.php';
}

// Boot plugin on 'plugins_loaded' (after WooCommerce, translations, etc).
add_action( 'plugins_loaded', static function () {
    if ( class_exists( '\GSW\Core\Plugin' ) ) {
        \GSW\Core\Plugin::instance();
    }
} );

// Activation / deactivation hooks.
register_activation_hook( __FILE__, static function () {
    if ( class_exists( \GSW\Core\Plugin::class ) ) {
        \GSW\Core\Plugin::activate();
    }
} );
register_deactivation_hook( __FILE__, static function () {
    if ( class_exists( \GSW\Core\Plugin::class ) ) {
        \GSW\Core\Plugin::deactivate();
    }
} );
