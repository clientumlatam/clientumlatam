<?php
namespace GSW\Core;

use WC_Product_Simple;
use WC_Product_Variable;
use GSW\Core\Image_Import;
use GSW\Core\Attr_Helper;
use GSW\Core\Stock_Status;
use GSW\Core\OpenAI;
use GSW\Core\Logs;

if (!defined('ABSPATH')) exit;

/**
 * Product insertion logic.
 * Creates simple or variable product depending on sizes count.
 * Applies category, prices, stock-status, attributes/variations, and default variation.
 */
class Insert_Product
{

    /**
     * Create a product from normalized row.
     * @param array  $n  Normalized item from Stage 6
     * @param string $rowId Import row id for logging
     * @return int product_id or 0 on failure
     */
    public static function create(array $n, string $rowId): int
    {
        if (!class_exists('WooCommerce')) {
            Logs::write($rowId, 'error', 'WooCommerce missing, cannot insert', ['sku'=>$n['sku'] ?? '']);
            return 0;
        }

        // Skip "Sold" items on insertion
        if (($n['status'] ?? '') === 'sold') {
            Logs::write($rowId, 'info', 'SOLD | Skip insert: status is Sold', ['sku'=>$n['sku']]);
            return 0;
        }

        if (!empty($n['use_images'])) {
            $folder = trim( (string) ( $n['images_folder'] ?? '' ) );

            if ( $folder !== '' ) {
                // Google Drive: pre-check folder has images before creating the product.
                $g = (array) get_option('gsw_google', []);
                $limit = (int)($g['count_image'] ?? $g['count_images'] ?? 6);
                $limit = max(1, min(20, $limit));

                $willImport = Image_Import::count_for_folder( $folder, $limit, $rowId );

                if ($willImport === 0) {
                    Logs::write($rowId, 'warn', 'Images not found in images_folder = ' . $folder, ['sku'=>$n['sku']]);
                    return 0;
                }
            } elseif ( ! Web_Image_Search::is_ready() ) {
                // No folder and no web search configured → nothing to do, skip.
                Logs::write($rowId, 'warn', 'INSERT Images: images_folder is empty and Web Image Search is not configured. Skipping.', ['sku'=>$n['sku']]);
                return 0;
            }
            // else: folder is empty but Web_Image_Search is ready → proceed, image fetched after save.
        }


        $sizes = is_array($n['sizes'] ?? null) ? $n['sizes'] : [];
        $isVariable = count($sizes) >= 1;

        try {
            if ($isVariable) {
                $product = new WC_Product_Variable();
            } else {
                $product = new WC_Product_Simple();
            }
            $sku     = trim($n['sku']);
            $title   = sanitize_text_field($n['title']);
            $base  = $sku . ' ' . $title;
            $slug  = sanitize_title($base);

            // Basic fields
            $product->set_name((string)($n['title'] ?? ''));
            $product->set_sku((string)($n['sku'] ?? ''));
            $product->set_slug($slug);
            $product->set_description((string)($n['description'] ?? ''));
            $product->set_status('publish');
            $product->set_catalog_visibility('visible');

            // Category
            $catId = (int)($n['category_id'] ?? 0);
            if ($catId > 0 && taxonomy_exists('product_cat')) {
                wp_set_object_terms(0, [$catId], 'product_cat'); // temp, will re-assign after save
            }

            // Prices & stock
            $st     = (string)($n['status'] ?? 'in_stock');
            $stock  = Attr_Helper::map_stock_status($st);

            if ($isVariable) {
                // Variable product prices are usually set per variation;
                // set parent as a fallback
                $product->set_regular_price((string)($n['price_regular'] ?? ''));
                $product->set_sale_price($n['price_sale'] !== null ? (string)$n['price_sale'] : '');
                $product->set_stock_status($stock);
            } else {
                // Simple product
                $product->set_regular_price((string)($n['price_regular'] ?? ''));
                $product->set_sale_price($n['price_sale'] !== null ? (string)$n['price_sale'] : '');
                $product->set_stock_status($stock);
            }

            // ----- AI content (on insert if enabled) -----
            if (!empty($n['use_ai'])) {
                // Resolve sale percent from statuses settings
                $statusHelper = new Stock_Status();
                $salePercent  = $statusHelper->salePercent();

                // Category name (for prompt context)
                $catName = '';
                if (!empty($n['category_id']) && taxonomy_exists('product_cat')) {
                    $t = get_term((int)$n['category_id'], 'product_cat');
                    $catName = ($t && !is_wp_error($t)) ? ($t->name ?: '') : '';
                }

                $vars = OpenAI::vars_from_normalized($n, [
                    'sale_percent'  => $salePercent,
                    'category_name' => $catName,
                    'language'      => get_locale(),
                    'prev_status'   => 'new',
                ]);

                $ai = OpenAI::generate($vars, $rowId);

                if ($ai) {
                    // Apply AI fields (fallback to feed if AI misses something)
                    if (!empty($ai['title'])) $product->set_name($ai['title']);
                    if (!empty($ai['short'])) $product->set_short_description($ai['short']);
                    if (!empty($ai['full']))  $product->set_description($ai['full']);
                    Logs::write($rowId, 'info', 'INSERT AI: content generated (insert)', ['sku'=>$n['sku']]);
                } else {
                    Logs::write($rowId, 'warn', 'INSERT AI: generation failed (insert), using feed', ['sku'=>$n['sku']]);
                    return false;
                }
            }

            $product_id = $product->save();

            // Assign category now that we have an ID
            if ($product_id && $catId > 0 && taxonomy_exists('product_cat')) {
                wp_set_object_terms($product_id, [$catId], 'product_cat', false);
            }

            // Build variations if needed
            if ($isVariable) {
                Attr_Helper::ensure_variations($product_id, $sizes, $n);
            }

            // If exactly 1 size was provided, we keep it simple as per spec.
            if (!$isVariable && !empty($sizes)) {
                // no-op by design; a single size does not force variable
            }

            if (!empty($n['use_images'])) {
            $folder = trim( (string) ( $n['images_folder'] ?? '' ) );

            if ( $folder !== '' ) {
                // --- Google Drive path (existing behaviour) ---
                $g = (array) get_option('gsw_google', []);
                $limit = (int)($g['count_image'] ?? $g['count_images'] ?? 6);
                $limit = max(1, min(20, $limit));

                $res = Image_Import::import_for_product(
                    (int)$product_id,
                    $folder,
                    $limit,
                    0,
                    $rowId
                );

                if (!empty($res['added'])) {
                    Logs::write($rowId, 'info', 'INSERT Images imported (Drive)', ['sku'=>$n['sku'], 'count'=>count($res['added'])]);
                }
                if (!empty($res['errors'])) {
                    Logs::write($rowId, 'warn', 'INSERT Images import issues: ' . implode('; ', array_slice($res['errors'], 0, 3)), ['sku'=>$n['sku']]);
                }

            } elseif ( Web_Image_Search::is_ready() ) {
                // --- Web Image Search fallback (Pixabay) ---
                $query     = trim( (string) ( $n['title'] ?? $n['sku'] ?? '' ) );
                $attach_id = Web_Image_Search::import_for_product( (int) $product_id, $query, $rowId );

                if ( $attach_id ) {
                    Logs::write( $rowId, 'info', 'INSERT Images imported (Web Search)', [ 'sku' => $n['sku'], 'attach_id' => $attach_id ] );
                } else {
                    Logs::write( $rowId, 'warn', 'INSERT Images: Web Search returned no image', [ 'sku' => $n['sku'], 'query' => $query ] );
                }

            } else {
                Logs::write($rowId, 'warn', 'INSERT Images: images_folder is empty and Web Image Search is not configured', ['sku'=>$n['sku']]);
            }
        }

            Logs::write($rowId, 'info', 'INSERT ok', ['sku'=>$n['sku'], 'id'=>$product_id]);
            return (int)$product_id;
        } catch (\Throwable $e) {
            Logs::write($rowId, 'error', 'INSERT failed: ' . $e->getMessage(), ['sku'=>$n['sku'] ?? '']);
            return 0;
        }
    }
}
