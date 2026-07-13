<?php
namespace GSW\Core;

use WC_Product_Variation;

if (!defined('ABSPATH')) exit;

class Attr_Helper
{
    /**
     * Map logical status -> WooCommerce stock status.
     *
     * waiting -> onbackorder
     * sold    -> outofstock
     * default -> instock (in_stock, sale, unknown, etc.)
     */
    public static function map_stock_status(string $st): string
    {
        switch ($st) {
            case 'waiting': return 'onbackorder';
            case 'sold':    return 'outofstock';
            default:        return 'instock';
        }
    }

    /**
     * Ensure variations exist for each size (upsert, no duplicates).
     * Uses global attribute pa_size (term slugs stored in variation meta).
     *
     * @param int   $product_id Parent product ID
     * @param array $sizes      Array of size rows: [ ['name'=>..., 'status'=>..., 'qty'=>...], ... ]
     * @param array $n          Normalized import row data (prices/status)
     */
    public static function ensure_variations(int $product_id, array $sizes, array $n): void
    {
        $product = wc_get_product($product_id);
        if (!$product) return;

        // Normalize input sizes.
        $norm = [];
        $sizeNames = [];
        foreach ($sizes as $s) {
            $name = trim((string)($s['name'] ?? ''));
            if ($name === '') continue;
            $norm[] = [
                'name'   => $name,
                'status' => (string)($s['status'] ?? ''),
                'qty'    => isset($s['qty']) && $s['qty'] !== '' ? (int)$s['qty'] : null,
            ];
            $sizeNames[] = $name;
        }
        if (!$norm) return;

        // Force using global pa_size attribute (taxonomy).
        [$attrKey, $term_ids, $term_slugs, $name_to_slug] = self::ensure_pa_size_attribute($product, $sizeNames);
        if (! $term_ids) return; // ничего не вышло

        // Build map of existing variations by slug (attribute_pa_size stores slug).
        $metaKey = 'attribute_' . $attrKey;  // 'attribute_pa_size'
        $existing = [];
        $q = new \WP_Query([
            'post_type'      => 'product_variation',
            'post_parent'    => $product_id,
            'posts_per_page' => -1,
            'fields'         => 'ids',
            'no_found_rows'  => true,
        ]);
        foreach ($q->posts as $vid) {
            $val = get_post_meta($vid, $metaKey, true);
            if ($val === '') continue;
            $existing[(string)$val] = (int)$vid;
        }

        $parentStock = self::parent_product_status($product_id, $n);
        $regular = (string)($n['price_regular'] ?? '');
        $sale    = array_key_exists('price_sale', $n) && $n['price_sale'] !== null ? (string)$n['price_sale'] : '';

        foreach ($norm as $row) {
            $name = $row['name'];
            if ($name === '' || !isset($name_to_slug[$name])) continue;

            // Variations must store ONLY term slug.
            $slug   = $name_to_slug[$name];
            $status = (string)($row['status'] ?? '');
            $stock  = self::map_stock_status($status === '' || $status === 'unknown' ? $parentStock : $status);
            $qty    = $row['qty'];

            $vid = $existing[$slug] ?? 0;
            $variation = $vid ? wc_get_product($vid) : new WC_Product_Variation();
            if (!$variation) continue;

            if (! $vid) {
                $variation->set_parent_id($product_id);
                $variation->set_attributes([$attrKey => $slug]); // IMPORTANT
            }

            if ($qty !== null && $qty !== 0) {
                $variation->set_manage_stock(true);
                $variation->set_stock_quantity((int)$qty);
            } else {
                $variation->set_manage_stock(false);
            }

            $variation->set_regular_price($regular);
            $variation->set_sale_price($sale);
            $variation->set_stock_status($stock);
            $variation->save();
        }

        // Default attribute on parent product must also be slug.
        $first = reset($norm);
        if ($first && isset($name_to_slug[$first['name']])) {
            $product->set_default_attributes([$attrKey => $name_to_slug[$first['name']]]);
            $product->save();
        }
    }


    /**
     * Custom product attribute "size" (if you decide NOT to use pa_size).
     * Currently not used when forcing pa_size.
     */
    protected static function ensure_custom_size_attribute(\WC_Product $product, array $options, bool $for_variations = true): void
    {
        $options = array_values(array_unique(array_filter(array_map('strval', $options))));
        $attrs   = $product->get_attributes();

        $attr = new \WC_Product_Attribute();
        $attr->set_id(0);                // 0 = custom attribute
        $attr->set_name('size');         // meta key 'attribute_size'
        $attr->set_options($options);    // list of text values
        $attr->set_visible(true);
        $attr->set_variation($for_variations);

        $attrs['size'] = $attr;
        $product->set_attributes($attrs);
        $product->save();
    }

    /**
     * Determine parent stock status: from import row or existing product.
     */
    public static function parent_product_status(int $product_id, array $n) : string
    {
        $parentStatusRaw = (string)($n['status'] ?? '');
        if ($parentStatusRaw === '') {
            $parentProduct = function_exists('wc_get_product') ? wc_get_product($product_id) : null;
            $parentStatusRaw = $parentProduct ? (string)$parentProduct->get_stock_status() : 'in_stock';
        }
        return $parentStatusRaw;
    }

    /**
     * Ensure global attribute "size" exists and assign terms to the product.
     *
     * Returns:
     *  [0] string $tax          Taxonomy name, e.g. 'pa_size'
     *  [1] int[]  $term_ids     Term IDs
     *  [2] string[] $term_slugs Term slugs (values only)
     *  [3] array<string,string> $name_to_slug Map: display name => slug
     */
    protected static function ensure_pa_size_attribute(\WC_Product $product, array $options): array
    {
        // Global attribute "size" (slug = size) -> taxonomy "pa_size"
        $attr_slug = wc_sanitize_taxonomy_name('size'); // 'size'
        $tax       = wc_attribute_taxonomy_name($attr_slug); // 'pa_size'

        // Create global attribute if not exists (and register taxonomies immediately).
        if (! taxonomy_exists($tax)) {
            $attr_id = wc_create_attribute([
                'slug'         => $attr_slug,
                'name'         => 'Size',
                'type'         => 'select',
                'order_by'     => 'menu_order',
                'has_archives' => false,
            ]);
            if (! is_wp_error($attr_id)) {
                delete_transient('wc_attribute_taxonomies');
                // Зарегистрировать таксономии сразу, чтобы не ждать следующего запроса
                if (function_exists('wc_register_attribute_taxonomies')) {
                    wc_register_attribute_taxonomies();
                }
            }
        }

        // Create/get terms
        $term_ids  = [];
        $term_map  = []; // name => slug
        foreach ($options as $raw) {
            $name = trim((string)$raw);
            if ($name === '') continue;

            $slug = sanitize_title($name);
            $t    = get_term_by('slug', $slug, $tax);
            if (! $t) {
                $res = wp_insert_term($name, $tax, ['slug' => $slug]);
                if (is_wp_error($res)) continue;
                $term_id = (int) $res['term_id'];
            } else {
                $term_id = (int) $t->term_id;
            }
            $term_ids[]        = $term_id;
            $term_map[$name]   = $slug;
        }
        if (! $term_ids) return [$tax, [], [], $term_map];

        // Assign terms to product and set variation attribute
        wp_set_object_terms($product->get_id(), $term_ids, $tax, false);

        $attrs = $product->get_attributes();

        $pa = new \WC_Product_Attribute();
        $pa->set_id( wc_attribute_taxonomy_id_by_name($attr_slug) );
        $pa->set_name($tax);              // 'pa_size'
        $pa->set_options($term_ids);      // IMPORTANT: must be term IDs here
        $pa->set_visible(true);
        $pa->set_variation(true);

        $attrs[$tax] = $pa;
        $product->set_attributes($attrs);
        $product->save();

        return [$tax, $term_ids, array_values($term_map), $term_map];
    }

}
