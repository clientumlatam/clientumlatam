<?php
if (!defined('ABSPATH')) exit;

/**
 * Reserved for shared hooks & custom schedules (to be extended on next steps).
 */

function ditsgsw_get_pro_url(): string
{
    return (string) apply_filters('gsw_pro_url', 'https://dits.agency/');
}

add_filter('gsw_mapping_footer_action_html', function ($default_html) {

    $pro_url = ditsgsw_get_pro_url();

    return sprintf(
        '<a class="button button-primary" href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
        esc_url($pro_url),
        esc_html__('Learn more about PRO', DITSGSW_TEXT_DOMAIN)
    );
}, 10);
