<?php
namespace GSW\Core;

use GSW\Core\Logs;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Web image search via Pixabay API.
 *
 * Pixabay offers a free REST API (100 req/hour, no credit card required).
 * Images are released under the Pixabay License, safe for commercial use.
 *
 * Registration: https://pixabay.com/api/docs/
 *
 * Option key: gsw_pixabay  { api_key: string, consent: int }
 */
class Web_Image_Search
{
    const OPT   = 'gsw_pixabay';
    const NONCE = 'gsw_pixabay_test';

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Search for an image by product title and download it into the WP media
     * library, attached to $product_id.
     *
     * Returns the attachment ID on success, 0 on failure.
     *
     * @param int    $product_id  WC product post ID.
     * @param string $query       Search text (usually product title).
     * @param string $row_id      Import row ID used for logging.
     */
    public static function import_for_product( int $product_id, string $query, string $row_id = '' ): int
    {
        $query = trim( $query );
        if ( $product_id <= 0 || $query === '' ) {
            return 0;
        }

        $api_key = self::api_key();
        if ( $api_key === '' ) {
            Logs::write( $row_id, 'error', 'WebImg: Pixabay API key not configured' );
            return 0;
        }

        $image_url = self::search( $query, $api_key, $row_id );
        if ( $image_url === '' ) {
            Logs::write( $row_id, 'warn', 'WebImg: no results for query', [ 'query' => $query ] );
            return 0;
        }

        Logs::write( $row_id, 'info', 'WebImg: downloading image', [ 'url' => $image_url ] );

        $attach_id = self::download_and_attach( $image_url, $product_id, $query, $row_id );
        if ( ! $attach_id ) {
            Logs::write( $row_id, 'error', 'WebImg: download/attach failed', [ 'url' => $image_url ] );
            return 0;
        }

        // Set as featured image.
        set_post_thumbnail( $product_id, $attach_id );

        Logs::write( $row_id, 'info', 'WebImg: featured image set', [ 'attach_id' => $attach_id ] );
        return $attach_id;
    }

    /**
     * Quick connectivity test — returns [ 'ok' => bool, 'message' => string ].
     */
    public static function test_connection( string $api_key ): array
    {
        if ( $api_key === '' ) {
            return [ 'ok' => false, 'message' => __( 'API key is empty.', DITSGSW_TEXT_DOMAIN ) ];
        }

        $url = add_query_arg( [
            'key'      => $api_key,
            'q'        => 'test',
            'per_page' => 3,
        ], 'https://pixabay.com/api/' );

        $resp = wp_remote_get( $url, [ 'timeout' => 15 ] );

        if ( is_wp_error( $resp ) ) {
            return [ 'ok' => false, 'message' => 'HTTP error: ' . $resp->get_error_message() ];
        }

        $code = (int) wp_remote_retrieve_response_code( $resp );
        $body = (string) wp_remote_retrieve_body( $resp );
        $json = json_decode( $body, true );

        if ( $code === 400 ) {
            $msg = $json['message'] ?? $body;
            return [ 'ok' => false, 'message' => 'Pixabay error: ' . $msg ];
        }

        if ( $code !== 200 ) {
            return [ 'ok' => false, 'message' => "HTTP $code" ];
        }

        $total = (int) ( $json['totalHits'] ?? $json['total'] ?? -1 );
        $msg   = $total >= 0
            ? sprintf( __( 'Pixabay connected. API key is valid (%d results for "test").', DITSGSW_TEXT_DOMAIN ), $total )
            : __( 'Pixabay connected. API key is valid.', DITSGSW_TEXT_DOMAIN );

        return [ 'ok' => true, 'message' => $msg ];
    }

    /**
     * Whether the feature is fully configured and consented.
     */
    public static function is_ready(): bool
    {
        $opt = (array) get_option( self::OPT, [] );
        return ! empty( $opt['consent'] ) && trim( (string) ( $opt['api_key'] ?? '' ) ) !== '';
    }

    // -----------------------------------------------------------------------
    // Internals
    // -----------------------------------------------------------------------

    protected static function api_key(): string
    {
        $opt = (array) get_option( self::OPT, [] );
        return trim( (string) ( $opt['api_key'] ?? '' ) );
    }

    /**
     * Call Pixabay API and return the best matching full-size image URL.
     * Tries "photo" type first; falls back to "all" if nothing found.
     */
    protected static function search( string $query, string $api_key, string $row_id ): string
    {
        $url = self::search_once( $query, $api_key, 'photo' );
        if ( $url !== '' ) {
            return $url;
        }

        // Fallback: broader search with any image type.
        Logs::write( $row_id, 'info', 'WebImg: photo search empty, retrying with image_type=all', [ 'query' => $query ] );
        return self::search_once( $query, $api_key, 'all' );
    }

    protected static function search_once( string $query, string $api_key, string $image_type ): string
    {
        $endpoint = add_query_arg( [
            'key'         => $api_key,
            'q'           => rawurlencode( $query ),
            'image_type'  => $image_type,
            'orientation' => 'horizontal',
            'per_page'    => 5,    // Fetch a few so we can pick the largest.
            'safesearch'  => 'true',
        ], 'https://pixabay.com/api/' );

        $resp = wp_remote_get( $endpoint, [ 'timeout' => 15 ] );

        if ( is_wp_error( $resp ) || (int) wp_remote_retrieve_response_code( $resp ) !== 200 ) {
            return '';
        }

        $json = json_decode( (string) wp_remote_retrieve_body( $resp ), true );
        $hits = $json['hits'] ?? [];

        if ( empty( $hits ) ) {
            return '';
        }

        // Prefer largeImageURL (full size), fallback to webformatURL (preview).
        foreach ( $hits as $hit ) {
            $url = (string) ( $hit['largeImageURL'] ?? $hit['webformatURL'] ?? '' );
            if ( $url !== '' ) {
                return $url;
            }
        }

        return '';
    }

    /**
     * Download a remote image URL and create a WP attachment linked to $product_id.
     */
    protected static function download_and_attach( string $image_url, int $product_id, string $query, string $row_id ): int
    {
        // Determine extension from URL.
        $path = parse_url( $image_url, PHP_URL_PATH );
        $ext  = strtolower( pathinfo( (string) $path, PATHINFO_EXTENSION ) );
        if ( ! in_array( $ext, [ 'jpg', 'jpeg', 'png', 'webp' ], true ) ) {
            $ext = 'jpg';
        }

        // Download into a temp file.
        $resp = wp_remote_get( $image_url, [ 'timeout' => 30 ] );
        if ( is_wp_error( $resp ) || (int) wp_remote_retrieve_response_code( $resp ) !== 200 ) {
            return 0;
        }

        $data = wp_remote_retrieve_body( $resp );
        if ( $data === '' ) {
            return 0;
        }

        // Build a clean filename from the product query.
        $base_name = sanitize_title( $query );
        if ( $base_name === '' ) {
            $base_name = 'product-image';
        }
        $filename = $base_name . '-web.' . $ext;

        // Save into WP uploads.
        $upload = wp_upload_bits( $filename, null, $data );
        if ( ! empty( $upload['error'] ) ) {
            Logs::write( $row_id, 'error', 'WebImg: wp_upload_bits failed: ' . $upload['error'] );
            return 0;
        }

        if ( ! function_exists( 'wp_check_filetype' ) ) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        if ( ! function_exists( 'wp_generate_attachment_metadata' ) ) {
            require_once ABSPATH . 'wp-admin/includes/image.php';
        }

        $wp_filetype = wp_check_filetype( $upload['file'], null );
        $mime        = $wp_filetype['type'] ?: 'image/jpeg';

        // Build attachment metadata.
        $product_title = '';
        $sku           = '';
        if ( function_exists( 'wc_get_product' ) ) {
            $p = wc_get_product( $product_id );
            if ( $p ) {
                $product_title = wp_strip_all_tags( $p->get_name() );
                $sku           = (string) $p->get_sku();
            }
        }

        $label      = $product_title ?: $query;
        $sku_suffix = $sku !== '' ? ' [' . $sku . ']' : '';
        $alt_text   = $label . $sku_suffix;
        $title      = $label . $sku_suffix . ' — Web';

        $attachment = [
            'post_mime_type' => $mime,
            'post_title'     => $title,
            'post_excerpt'   => $title,   // caption
            'post_content'   => '',
            'post_status'    => 'inherit',
        ];

        $attach_id = wp_insert_attachment( $attachment, $upload['file'], $product_id );
        if ( ! $attach_id ) {
            return 0;
        }

        if ( $alt_text !== '' ) {
            update_post_meta( $attach_id, '_wp_attachment_image_alt', $alt_text );
        }

        $meta = wp_generate_attachment_metadata( $attach_id, $upload['file'] );
        wp_update_attachment_metadata( $attach_id, $meta );

        return (int) $attach_id;
    }
}
