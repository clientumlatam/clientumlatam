<?php
if (!defined('ABSPATH')) exit;

/**
 * Generic helpers.
 */

function ditsgsw_array_get(array $arr, $key, $default = null) {
    return $arr[$key] ?? $default;
}

function ditsgsw_manage_capability(): string {
    return current_user_can('manage_woocommerce') ? 'manage_woocommerce' : 'manage_options';
}

function ditsgsw_current_user_can_manage(): bool {
    return current_user_can(ditsgsw_manage_capability());
}

function ditsgsw_nonce_field($action) {
    wp_nonce_field($action, $action . '_nonce');
}

function ditsgsw_verify_nonce_or_die($action) {
    if (!isset($_POST[$action . '_nonce']) || !wp_verify_nonce($_POST[$action . '_nonce'], $action)) {
        wp_die(esc_html__('Security check failed.', DITSGSW_TEXT_DOMAIN));
    }
}
