<?php
namespace GSW\Core;

use WC_Product;
use GSW\Core\Attr_Helper;
use GSW\Core\Logs;
use GSW\Core\Stock_Status;
use GSW\Core\OpenAI;

if (!defined('ABSPATH')) exit;

/**
 * Product update logic with status transitions and full variation rebuild when required.
 */
class Update_Product
{
    public static function map_stock_status(string $st): string
    {
        return Attr_Helper::map_stock_status($st);
    }

    /** Classify current product status (in_stock|sale|waiting|sold) from Woo props. */
    protected static function classify_current(WC_Product $p): string
    {
        if ($p->get_stock_status() === 'onbackorder') return 'waiting';
        if ($p->get_stock_status() === 'outofstock') return 'sold';
        // On sale?
        if ($p->is_on_sale()) return 'sale';
        return 'in_stock';
    }

    /** Check presence of any price on product or its variations. */
    protected static function has_any_price(WC_Product $p): bool
    {
        $price = (float)$p->get_price();
        if ($price > 0) return true;
        if ($p->is_type('variable')) {
            foreach ($p->get_children() as $vid) {
                $v = wc_get_product($vid);
                if ($v && (float)$v->get_price() > 0) return true;
            }
        }
        return false;
    }

    /**
     * Update product by normalized data.
     * Implements TЗ transitions (2.2.2.*), price/markup already applied in normalized data.
     */
    public static function apply(array $n, int $product_id, string $rowId): bool
    {
        if (!class_exists('WooCommerce')) {
            Logs::write($rowId, 'error', 'WooCommerce missing, cannot update', ['sku'=>$n['sku'] ?? '', 'id'=>$product_id]);
            return false;
        }

        $p = wc_get_product($product_id);
        if (!$p) {
            Logs::write($rowId, 'error', 'Product not found by ID', ['id'=>$product_id]);
            return false;
        }

        try {
            // Category (assign/ensure)
            $catId = (int)($n['category_id'] ?? 0);
            if ($catId > 0 && taxonomy_exists('product_cat')) {
                wp_set_object_terms($product_id, [$catId], 'product_cat', false);
            }

            $desiredRaw = (string)($n['status'] ?? 'in_stock');
            $desired = in_array($desiredRaw, ['in_stock', 'sale', 'waiting', 'sold'], true)
                ? $desiredRaw
                : 'in_stock';
            $current = self::classify_current($p);
            $statusChanged = ($desired !== $current);
            $openAiSettings = (array) get_option('gsw_openai', []);
            $forceAiRegeneration = !empty($openAiSettings['force_regenerate_updates']);

            $sizes = is_array($n['sizes'] ?? null) ? $n['sizes'] : [];
            $wantVariable = count($sizes) >= 1;
            $isVariable   = $p->is_type('variable');

            // Convert type if needed
            if ($wantVariable && !$isVariable) {
                self::convert_to_variable($product_id, $sizes, $n);
                $p = wc_get_product($product_id); // refresh
                $isVariable = true;
            } elseif (!$wantVariable && $isVariable) {
                self::convert_to_simple($product_id, $n);
                $p = wc_get_product($product_id);
                $isVariable = false;
            }

            // Regenerate content when AI is enabled and either stock status changed
            // or forced regeneration on every update is enabled in OpenAI settings.
            $regenerateAi = function() use ($n, $rowId, $current, $desired, $statusChanged, $forceAiRegeneration, &$p): bool {
                if (empty($n['use_ai']) || (!$statusChanged && !$forceAiRegeneration)) {
                    return true;
                }

                $statusHelper = new Stock_Status();
                $salePercent  = $statusHelper->salePercent();
                $catName = '';
                if (!empty($n['category_id']) && taxonomy_exists('product_cat')) {
                    $t = get_term((int)$n['category_id'], 'product_cat');
                    $catName = ($t && !is_wp_error($t)) ? ($t->name ?: '') : '';
                }

                $varsInput = $n;
                $varsInput['status'] = $desired;
                $vars = OpenAI::vars_from_normalized($varsInput, [
                    'sale_percent'  => $salePercent,
                    'category_name' => $catName,
                    'language'      => get_locale(),
                    'prev_status'   => $current,
                ]);

                $ai = OpenAI::generate($vars, $rowId);
                if (!$ai) {
                    return false;
                }

                if (!empty($ai['title'])) $p->set_name($ai['title']);
                if (!empty($ai['short'])) $p->set_short_description($ai['short']);
                if (!empty($ai['full']))  $p->set_description($ai['full']);

                Logs::write(
                    $rowId,
                    'info',
                    sprintf(
                        'UPDATE AI: content regenerated (%s)',
                        $statusChanged ? $desired : ('forced ' . $desired)
                    ),
                    ['sku'=>$n['sku']]
                );
                return true;
            };

            // Apply status transitions.
            $logMessage = 'UPDATE in_stock';
            if ($desired === 'sold') {
                self::set_prices($p, null, null, true);
                $p->set_stock_status(self::map_stock_status('sold'));
                $logMessage = 'UPDATE -> Sold (price removed)';
            } elseif ($desired === 'waiting') {
                $p->set_stock_status(self::map_stock_status('waiting'));
                self::set_prices($p, (string)$n['price_regular'], null, false);
                $logMessage = 'UPDATE waiting';
            } elseif ($desired === 'sale') {
                $p->set_stock_status(self::map_stock_status('sale'));
                self::set_prices($p, (string)$n['price_regular'], (string)$n['price_sale'], false);
                $logMessage = 'UPDATE sale';
            } else { // in_stock
                $p->set_stock_status(self::map_stock_status('in_stock'));
                self::set_prices($p, (string)$n['price_regular'], null, false);
                $logMessage = 'UPDATE in_stock';
            }

            if (!$regenerateAi()) {
                return false;
            }

            $p->save();
            if ($isVariable) {
                Attr_Helper::ensure_variations($product_id, $sizes, $n);
            }

            Logs::write($rowId, 'info', $logMessage, ['sku'=>$n['sku'], 'id'=>$product_id]);
            return true;

        } catch (\Throwable $e) {
            Logs::write($rowId, 'error', 'UPDATE failed: ' . $e->getMessage(), ['sku'=>$n['sku'] ?? '', 'id'=>$product_id]);
            return false;
        }
    }

    /** Set main product prices; when $clear=true remove all prices. */
    protected static function set_prices(WC_Product $p, ?string $regular, ?string $sale, bool $clear): void
    {
        if ($clear) {
            $p->set_regular_price('');
            $p->set_sale_price('');
            if ($p->is_type('variable')) {
                foreach ($p->get_children() as $vid) {
                    $v = wc_get_product($vid);
                    if ($v) { $v->set_regular_price(''); $v->set_sale_price(''); $v->save(); }
                }
            }
            return;
        }
        $p->set_regular_price($regular ?? '');
        $p->set_sale_price($sale ?: '');
        if ($p->is_type('variable')) {
            foreach ($p->get_children() as $vid) {
                $v = wc_get_product($vid);
                if ($v) {
                    $v->set_regular_price($regular ?? '');
                    $v->set_sale_price($sale ?: '');
                    $v->save();
                }
            }
        }
    }

    /** Convert simple -> variable and build variations by sizes. */
    protected static function convert_to_variable(int $product_id, array $sizes, array $n): void
    {
        // mark post type as variable
        wp_set_object_terms($product_id, 'variable', 'product_type', false);
        Attr_Helper::ensure_variations($product_id, $sizes, $n);
    }

    /** Convert variable -> simple, delete variations and attributes. */
    protected static function convert_to_simple(int $product_id, array $n): void
    {
        // delete variations
        $children = get_children([
            'post_parent' => $product_id,
            'post_type'   => 'product_variation',
            'fields'      => 'ids',
            'numberposts' => -1,
        ]);
        foreach ($children as $vid) {
            wp_delete_post((int)$vid, true);
        }
        delete_post_meta($product_id, '_product_attributes');
        delete_post_meta($product_id, '_default_attributes');
        wp_set_object_terms($product_id, 'simple', 'product_type', false);

        // set prices to parent
        $p = wc_get_product($product_id);
        if ($p) {
            $p->set_regular_price((string)($n['price_regular'] ?? ''));
            $p->set_sale_price($n['price_sale'] !== null ? (string)$n['price_sale'] : '');
            $p->save();
        }
    }
}
