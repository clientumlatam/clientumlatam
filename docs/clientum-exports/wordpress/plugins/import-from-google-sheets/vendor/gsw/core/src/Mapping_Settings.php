<?php
namespace GSW\Core;

if (!defined('ABSPATH')) exit;

/**
 * Import configuration page: repeatable rows with mapping fields.
 */
class Mapping_Settings
{
    public static function boot(): void
    {
        // Register the option with sanitizer.
        add_action('admin_init', [self::class, 'register_option']);
        add_filter('option_page_capability_gsw_mapping_group', [self::class, 'settings_capability']);

        // Enqueue UI assets only on our page.
        add_action('admin_enqueue_scripts', [self::class, 'enqueue_assets']);
    }

    public static function settings_capability(): string
    {
        return function_exists('ditsgsw_manage_capability') ? ditsgsw_manage_capability() : 'manage_options';
    }

    public static function register_option(): void
    {
        register_setting('gsw_mapping_group', 'gsw_import_configs', [
            'type'              => 'array',
            'sanitize_callback' => [self::class, 'sanitize_rows'],
            'default'           => [],
        ]);
    }

    public static function enqueue_assets($hook): void
    {
        if (!isset($_GET['page']) || $_GET['page'] !== 'gsw-importer') {
            return;
        }

        wp_enqueue_style(
            'gsw-mapping-settings',
            Assets::url('gsw-core/admin/mapping-settings.css'),
            [],
            Assets::ver('gsw-core/admin/mapping-settings.css')
        );

        wp_enqueue_script(
            'gsw-mapping-settings',
            Assets::url('gsw-core/admin/mapping-settings.js'),
            ['jquery'],
            Assets::ver('gsw-core/admin/mapping-settings.js'),
            true
        );
    }

    /**
     * Render the Import configuration page content (called from Admin::render_import_config()).
     */
    public static function render_page(): void
    {
        $rows = get_option('gsw_import_configs', []);
        $can_images = self::can_use_images();
        $can_ai     = self::can_use_ai();

        $images_reason = $can_images ? '' : self::images_disabled_reason();
        $ai_reason     = $can_ai ? '' : self::ai_disabled_reason();
        ?>

        <?php if (!$can_images): ?>
            <div class="notice notice-warning inline">
                <p><?php echo esc_html($images_reason); ?></p>
            </div>
        <?php endif; ?>

        <?php if (!$can_ai): ?>
            <div class="notice notice-warning inline">
                <p><?php echo esc_html($ai_reason); ?></p>
            </div>
        <?php endif; ?>

        <form method="post" action="options.php">
            <?php settings_fields('gsw_mapping_group'); ?>
            <p class="description">
                <?php esc_html_e('Configure import files. Column indexes are 1-based (first column is 1).', DITSGSW_TEXT_DOMAIN); ?>
            </p>

            <table class="widefat fixed striped gsw-table" id="gsw-rows">
                <thead>
                <tr>
                    <th><?php esc_html_e('Category', DITSGSW_TEXT_DOMAIN); ?></th>
                    <th><?php esc_html_e('Google Sheet URL', DITSGSW_TEXT_DOMAIN); ?></th>
                    <th class="gsw-start"><?php esc_html_e('Start row', DITSGSW_TEXT_DOMAIN); ?></th>
                    <th><?php esc_html_e('Columns', DITSGSW_TEXT_DOMAIN); ?></th>
                    <th><?php esc_html_e('Options', DITSGSW_TEXT_DOMAIN); ?></th>
                    <th class="gsw-actions"><?php esc_html_e('Actions', DITSGSW_TEXT_DOMAIN); ?></th>
                </tr>
                </thead>
                <tbody>
                <?php if (empty($rows)) : ?>
                    <?php $rows = [[]]; // one empty row ?>
                <?php endif; ?>
                <?php foreach ($rows as $i => $row): $row = is_array($row) ? $row : []; ?>
                    <?php $size_cols = isset($row['size_cols']) && is_array($row['size_cols']) ? $row['size_cols'] : []; ?>
                    <tr class="gsw-row" data-index="<?php echo (int)$i; ?>">
                        <td>
                            <?php echo self::dropdown_category("gsw_import_configs[$i][category]", (int)($row['category'] ?? 0)); ?>
                            <span class="gsw-help"><?php esc_html_e('WooCommerce product category for imported items.', DITSGSW_TEXT_DOMAIN); ?></span>
                        </td>
                        <td>
                            <input type="text" name="gsw_import_configs[<?php echo (int)$i; ?>][url]" value="<?php echo esc_attr($row['url'] ?? ''); ?>" placeholder="https://... (Google Sheet or CSV)" />
                            <span class="gsw-help"><?php esc_html_e('Link to Google Sheet or CSV file.', DITSGSW_TEXT_DOMAIN); ?></span>
                        </td>
                        <td class="gsw-start">
                            <input type="number" min="1" name="gsw_import_configs[<?php echo (int)$i; ?>][start_row]" value="<?php echo esc_attr($row['start_row'] ?? 1); ?>" class="col-small" />
                            <span class="gsw-help"><?php esc_html_e('Row number to start from (1-based).', DITSGSW_TEXT_DOMAIN); ?></span>
                        </td>
                        <td>
                            <label class='gsw-wrapper'>
                                <span class="gsw-label"><?php esc_html_e('Status col', DITSGSW_TEXT_DOMAIN); ?> </span>
                                <input type="number" min="1" class="col-small gsw-data" name="gsw_import_configs[<?php echo (int)$i; ?>][col_status]" value="<?php echo esc_attr($row['col_status'] ?? ''); ?>" />
                            </label>
                            <span class="gsw-help"><?php echo esc_html__('Status col: number of the column containing textual product status (e.g., "In stock", "Sale").', DITSGSW_TEXT_DOMAIN);?></span>
                            <label class='gsw-wrapper'>
                                <span class="gsw-label"><?php esc_html_e('SKU col', DITSGSW_TEXT_DOMAIN); ?></span>
                                <input type="number" min="1" class="col-small gsw-data" name="gsw_import_configs[<?php echo (int)$i; ?>][col_sku]" value="<?php echo esc_attr($row['col_sku'] ?? ''); ?>" />
                            </label>
                            <label class='gsw-wrapper'>
                                <span class="gsw-label"><?php esc_html_e('Title col', DITSGSW_TEXT_DOMAIN); ?></span>
                                <input type="number" min="1" class="col-small gsw-data" name="gsw_import_configs[<?php echo (int)$i; ?>][col_title]" value="<?php echo esc_attr($row['col_title'] ?? ''); ?>" />
                            </label>
                            <label class='gsw-wrapper'>
                                <span class="gsw-label"><?php esc_html_e('Description col', DITSGSW_TEXT_DOMAIN); ?></span>
                                <input type="number" min="1" class="col-small gsw-data" name="gsw_import_configs[<?php echo (int)$i; ?>][col_description]" value="<?php echo esc_attr($row['col_description'] ?? ''); ?>" />
                            </label>
                            <label class='gsw-wrapper'>
                                <span class="gsw-label"><?php esc_html_e('Price col', DITSGSW_TEXT_DOMAIN); ?></span>
                                <input type="number" min="1" class="col-small gsw-data" name="gsw_import_configs[<?php echo (int)$i; ?>][col_price]" value="<?php echo esc_attr($row['col_price'] ?? ''); ?>" />
                            </label>

                            <!-- Sizes -->
                            <label class='gsw-wrapper'>
                                <input type="checkbox" class="js-use-sizes" name="gsw_import_configs[<?php echo (int)$i; ?>][use_sizes]" <?php checked(!empty($row['use_sizes'])); ?> />
                                <input type="hidden"
                                        class="js-size-cols-saved"
                                        value="<?php echo esc_attr(wp_json_encode($size_cols)); ?>" />
                                <span class="gsw-badge"><?php esc_html_e('Sizes', DITSGSW_TEXT_DOMAIN); ?></span>
                            </label>
                            <span class="gsw-help"><?php esc_html_e('Provide columns with size names. If multiple, product becomes variable.', DITSGSW_TEXT_DOMAIN); ?></span>
                            <div class="gsw-conditional js-sizes-wrap gsw-my-6">
                                <label class='gsw-wrapper'>
                                    <span class="gsw-label"><?php esc_html_e('Count', DITSGSW_TEXT_DOMAIN); ?></span>
                                    <input type="number" min="0" max="20" class="col-small js-sizes-count gsw-data" name="gsw_import_configs[<?php echo (int)$i; ?>][sizes_count]" value="<?php echo esc_attr($row['sizes_count'] ?? 0); ?>" />
                                </label>
                                <div class="js-size-cols gsw-grid gsw-mt-6">
                                    <?php
                                    $cnt = isset($row['sizes_count']) ? max(0, (int)$row['sizes_count']) : 0;
                                    for ($k=0; $k<$cnt; $k++): ?>
                                        <label>
                                            <span>#<?php echo $k+1; ?></span>
                                            <input type="number" min="1" class="col-small" name="gsw_import_configs[<?php echo (int)$i; ?>][size_cols][<?php echo (int)$k; ?>]" value="<?php echo esc_attr($size_cols[$k] ?? ''); ?>" />
                                        </label>
                                    <?php endfor; ?>
                                </div>
                                <span class="gsw-help"><?php esc_html_e('Only the column with size name is required (status may be embedded in size text).', DITSGSW_TEXT_DOMAIN); ?></span>
                            </div>
                        </td>
                        <td>
                            <!-- Markup -->
                            <label class='gsw-wrapper'>
                                <input type="checkbox" class="js-use-markup" name="gsw_import_configs[<?php echo (int)$i; ?>][use_markup]" <?php checked(!empty($row['use_markup'])); ?> />
                                <span class="gsw-badge"><?php esc_html_e('Markup', DITSGSW_TEXT_DOMAIN); ?></span>
                            </label>
                            <span class="gsw-help"><?php esc_html_e('Markup: multiplier > 1.0. Example: 1.15 adds 15% to the base price before RRP constraints.', DITSGSW_TEXT_DOMAIN); ?></span>
                            <div class="gsw-conditional js-markup-wrap gsw-my-6">
                                <label class='gsw-wrapper'>
                                    <span class="gsw-label"><?php esc_html_e('Markup value', DITSGSW_TEXT_DOMAIN); ?></span>
                                    <input type="text" name="gsw_import_configs[<?php echo (int)$i; ?>][markup_value]" value="<?php echo esc_attr($row['markup_value'] ?? ''); ?>" class="col-small gsw-data" />
                                </label>
                                <span class="gsw-help"><?php esc_html_e('Markup: multiplier > 1.0. Example: 1.15 adds 15% to the base price before RRP constraints.', DITSGSW_TEXT_DOMAIN); ?></span>
                                <label class='gsw-wrapper'>
                                    <span class="gsw-label"><?php esc_html_e('RRP col', DITSGSW_TEXT_DOMAIN); ?></span>
                                    <input type="number" min="0" class="col-small gsw-data" name="gsw_import_configs[<?php echo (int)$i; ?>][col_rrp]" value="<?php echo esc_attr($row['col_rrp'] ?? ''); ?>" />
                                </label>
                                <span class="gsw-help"><?php esc_html_e('RRP col: may contain a single value "199.99" or a range "180-220".', DITSGSW_TEXT_DOMAIN); ?></span>
                            </div>

                            <!-- Images -->
                             <?php
                            $images_checked = $can_images && !empty($row['use_images']);
                            ?>
                            <label class='gsw-wrapper'>
                                <input type="checkbox" class="js-use-images" name="gsw_import_configs[<?php echo (int)$i; ?>][use_images]" <?php checked(!empty($row['use_images'])); ?> <?php echo disabled($can_images, false, false); ?> />
                                <span class="gsw-badge"><?php esc_html_e('Images', DITSGSW_TEXT_DOMAIN); ?></span>
                            </label>
                            <?php if (!$can_images): ?>
                                <span class="gsw-help"><?php echo esc_html($images_reason); ?></span>
                            <?php else: ?>
                                <span class="gsw-help"><?php esc_html_e('Images: uses Google Drive folder if provided, otherwise searches Pixabay by product title.', DITSGSW_TEXT_DOMAIN); ?></span>
                            <?php endif; ?>
                            <div class="gsw-conditional js-images-wrap gsw-my-6">
                                <label class='gsw-wrapper'>
                                    <span class="gsw-label"><?php esc_html_e('Folder col', DITSGSW_TEXT_DOMAIN); ?></span>
                                    <input type="number" min="0" class="col-small gsw-data" name="gsw_import_configs[<?php echo (int)$i; ?>][col_images]" value="<?php echo esc_attr($row['col_images'] ?? ''); ?>" />
                                </label>
                            </div>

                            <!-- AI -->
                            <?php
                            $ai_checked = $can_ai && !empty($row['use_ai']);
                            ?>
                            <label class='gsw-wrapper'>
                                <input type="checkbox" name="gsw_import_configs[<?php echo (int)$i; ?>][use_ai]" <?php checked(!empty($row['use_ai'])); ?> <?php echo disabled($can_ai, false, false); ?> />
                                <span class="gsw-badge"><?php esc_html_e('AI integration', DITSGSW_TEXT_DOMAIN); ?></span>
                            </label>
                            <?php if (!$can_ai): ?>
                                <span class="gsw-help"><?php echo esc_html($ai_reason); ?></span>
                            <?php else: ?>
                                <span class="gsw-help"><?php esc_html_e('Generates Title / Short / Full from prompts during updates according to OpenAI settings.', DITSGSW_TEXT_DOMAIN); ?></span>
                            <?php endif; ?>

                            <!-- Hidden ID holder to keep stable identity -->
                            <input type="hidden" name="gsw_import_configs[<?php echo (int)$i; ?>][id]" value="<?php echo esc_attr($row['id'] ?? ''); ?>" />
                        </td>
                        <td class="gsw-actions">
                            <button class="button button-secondary js-remove-row"><?php esc_html_e('Remove', DITSGSW_TEXT_DOMAIN); ?></button>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
                <tfoot>
                <tr>
                    <td colspan="6">
                        <?php echo (string) apply_filters( 'gsw_mapping_footer_action_html', '' ); ?>
                    </td>
                </tr>
                </tfoot>
            </table>

            <?php submit_button(__('Save', DITSGSW_TEXT_DOMAIN)); ?>
        </form>

        <!-- Row template -->
        <template id="gsw-row-template">
            <tr class="gsw-row" data-index="__i__">
                <td>
                    <?php echo self::dropdown_category('gsw_import_configs[__i__][category]', 0); ?>
                    <span class="gsw-help"><?php esc_html_e('WooCommerce product category for imported items.', DITSGSW_TEXT_DOMAIN); ?></span>
                </td>
                <td>
                    <input type="text" name="gsw_import_configs[__i__][url]" placeholder="https://... (Google Sheet or CSV)" required />
                    <span class="gsw-help"><?php esc_html_e('Link to Google Sheet or CSV file.', DITSGSW_TEXT_DOMAIN); ?></span>
                </td>
                <td class="gsw-start">
                    <input type="number" min="1" name="gsw_import_configs[__i__][start_row]" value="1" class="col-small" />
                    <span class="gsw-help"><?php esc_html_e('Row number to start from (1-based).', DITSGSW_TEXT_DOMAIN); ?></span>
                </td>
                <td>
                    <label class='gsw-wrapper'>
                        <span class="gsw-label"><?php esc_html_e('Status col', DITSGSW_TEXT_DOMAIN); ?></span>
                        <input type="number" min="1" class="col-small gsw-data" name="gsw_import_configs[__i__][col_status]" />
                    </label>
                    <span class="gsw-help"><?php echo esc_html__('Status col: number of the column containing textual product status (e.g., "In stock", "Sale").', DITSGSW_TEXT_DOMAIN);?></span>
                    <label class='gsw-wrapper'>
                        <span class="gsw-label"><?php esc_html_e('SKU col', DITSGSW_TEXT_DOMAIN); ?></span>
                        <input type="number" min="1" class="col-small gsw-data" name="gsw_import_configs[__i__][col_sku]" />
                    </label>
                    <label class='gsw-wrapper'>
                        <span class="gsw-label"><?php esc_html_e('Title col', DITSGSW_TEXT_DOMAIN); ?></span>
                        <input type="number" min="1" class="col-small gsw-data" name="gsw_import_configs[__i__][col_title]" />
                    </label>
                    <label class='gsw-wrapper'>
                        <span class="gsw-label"><?php esc_html_e('Description col', DITSGSW_TEXT_DOMAIN); ?></span>
                        <input type="number" min="1" class="col-small gsw-data" name="gsw_import_configs[__i__][col_description]" />
                    </label>
                    <label class='gsw-wrapper'>
                        <span class="gsw-label"><?php esc_html_e('Price col', DITSGSW_TEXT_DOMAIN); ?></span>
                        <input type="number" min="1" class="col-small gsw-data" name="gsw_import_configs[__i__][col_price]" />
                    </label>

                    <label class='gsw-wrapper'>
                        <input type="checkbox" class="js-use-sizes" name="gsw_import_configs[__i__][use_sizes]" /> 
                        <span class="gsw-badge"><?php esc_html_e('Sizes', DITSGSW_TEXT_DOMAIN); ?></span>
                    </label>
                    <span class="gsw-help"><?php esc_html_e('Provide columns with size names. If multiple, product becomes variable.', DITSGSW_TEXT_DOMAIN); ?></span>
                    <div class="gsw-conditional js-sizes-wrap gsw-my-6">
                        <label class='gsw-wrapper'>
                            <span class="gsw-label"><?php esc_html_e('Count', DITSGSW_TEXT_DOMAIN); ?></span>
                            <input type="number" min="1" max="20" class="col-small js-sizes-count gsw-data" name="gsw_import_configs[__i__][sizes_count]" value="1" />
                        </label>
                        <div class="js-size-cols gsw-grid gsw-mt-6"></div>
                        <span class="gsw-help"><?php esc_html_e('Only the column with size name is required (status may be embedded in size text).', DITSGSW_TEXT_DOMAIN); ?></span>
                    </div>
                </td>
                <td>
                    <label class='gsw-wrapper'>
                        <input type="checkbox" class="js-use-markup" name="gsw_import_configs[__i__][use_markup]" /> 
                        <span class="gsw-badge"><?php esc_html_e('Markup', DITSGSW_TEXT_DOMAIN); ?></span>
                    </label>
                    <span class="gsw-help"><?php esc_html_e('Markup: multiplier > 1.0. Example: 1.15 adds 15% to the base price before RRP constraints.', DITSGSW_TEXT_DOMAIN); ?></span>
                    <div class="gsw-conditional js-markup-wrap gsw-my-6">
                        <label class='gsw-wrapper'>
                            <span class="gsw-label"><?php esc_html_e('Markup value', DITSGSW_TEXT_DOMAIN); ?></span>
                            <input type="text" name="gsw_import_configs[__i__][markup_value]" class="col-small gsw-data" />
                        </label>
                        <span class="gsw-help"><?php esc_html_e('Markup: multiplier > 1.0. Example: 1.15 adds 15% to the base price before RRP constraints.', DITSGSW_TEXT_DOMAIN); ?></span>
                        <label class='gsw-wrapper'>
                            <span class="gsw-label"><?php esc_html_e('RRP col', DITSGSW_TEXT_DOMAIN); ?></span>
                            <input type="number" min="1" class="col-small gsw-data" name="gsw_import_configs[__i__][col_rrp]" />
                        </label>
                    </div>

                    <label class='gsw-wrapper'>
                        <input type="checkbox" class="js-use-images" name="gsw_import_configs[__i__][use_images]" <?php echo disabled($can_images, false, false); ?> /> 
                        <span class="gsw-badge"><?php esc_html_e('Images', DITSGSW_TEXT_DOMAIN); ?></span>
                    </label>
                    <span class="gsw-help">
                        <?php echo esc_html($can_images ? __('Images: Google Drive folder must be shared publicly or with the Service Account email.', DITSGSW_TEXT_DOMAIN) : $images_reason); ?>
                    </span>
                    <div class="gsw-conditional js-images-wrap gsw-my-6">
                        <label class='gsw-wrapper'>
                            <span class="gsw-label"><?php esc_html_e('Folder col', DITSGSW_TEXT_DOMAIN); ?> </span>
                            <input type="number" min="1" class="col-small gsw-data" name="gsw_import_configs[__i__][col_images]" />
                        </label>
                    </div>

                    <label class='gsw-wrapper'>
                        <input type="checkbox" name="gsw_import_configs[__i__][use_ai]" <?php echo disabled($can_ai, false, false); ?> /> 
                        <span class="gsw-badge"><?php esc_html_e('AI integration', DITSGSW_TEXT_DOMAIN); ?></span>
                    </label>
                    <span class="gsw-help">
                        <?php echo esc_html($can_ai ? __('Generates Title / Short / Full from prompts during updates according to OpenAI settings.', DITSGSW_TEXT_DOMAIN) : $ai_reason); ?>
                    </span>
                    <input type="hidden" name="gsw_import_configs[__i__][id]" value="" />
                </td>
                <td class="gsw-actions"><button class="button button-secondary js-remove-row"><?php esc_html_e('Remove', DITSGSW_TEXT_DOMAIN); ?></button></td>
            </tr>
        </template>
        <?php
    }

    /** Build a dropdown of product_cat terms (hierarchical). */
    public static function dropdown_category(string $name, int $selected = 0, array $extra = []): string
    {
        if (!taxonomy_exists('product_cat')) {
            return '<em>' . esc_html__('WooCommerce not active', DITSGSW_TEXT_DOMAIN) . '</em>';
        }
        // Ensure placeholder has empty value so HTML5 "required" works
        $show_option_none  = $extra['show_option_none']  ?? __('— Select —', DITSGSW_TEXT_DOMAIN);
        $option_none_value = $extra['option_none_value'] ?? ''; // IMPORTANT: empty value

        $args = [
            'taxonomy'         => 'product_cat',
            'hide_empty'       => false,
            'name'             => $name,
            'orderby'          => 'name',
            'hierarchical'     => true,
            'show_option_none'  => $show_option_none,
            'option_none_value' => $option_none_value,
            'echo'             => 0,
            'selected'         => $selected,
            'required'         => true,
        ];
        return wp_dropdown_categories($args);
    }

    /** Server-side sanitizer/validator for gsw_import_configs. */
    public static function sanitize_rows($in): array
    {
        $out = [];
        if (!is_array($in)) return $out;

        $can_images = self::can_use_images();
        $can_ai     = self::can_use_ai();

        $errors = [];
        $row_num = 0;

        foreach ($in as $idx => &$row) {
            if (!is_array($row)) continue;

            $row_num++;

            $category   = isset($row['category']) ? (int)$row['category'] : 0;
            if ($category <= 0) $errors[] = sprintf(__('Row %d: Category is required.', DITSGSW_TEXT_DOMAIN), $row_num);
            if ($category > 0 && !term_exists($category, 'product_cat')) $category = 0;

            $url        = isset($row['url']) ? esc_url_raw(trim((string)$row['url'])) : '';
            if ($url === '') $errors[] = sprintf(__('Row %d: Google Sheet URL is required.', DITSGSW_TEXT_DOMAIN), $row_num);
            $start_row  = isset($row['start_row']) ? max(1, (int)$row['start_row']) : 1;

            foreach (['col_status','col_sku','col_title','col_description','col_price'] as $key) {
                $row[$key] = max(1, (int)($row[$key] ?? 0));
                if ($row[$key] === 0) $errors[] = sprintf(__('Row %d: %s must be a positive column index.', DITSGSW_TEXT_DOMAIN), $row_num, $key);
            }
            $col_status      = isset($row['col_status']) ? max(1, (int)$row['col_status']) : 0;
            $col_sku         = isset($row['col_sku']) ? max(1, (int)$row['col_sku']) : 0;
            $col_title       = isset($row['col_title']) ? max(1, (int)$row['col_title']) : 0;
            $col_description = isset($row['col_description']) ? max(1, (int)$row['col_description']) : 0;
            $col_price       = isset($row['col_price']) ? max(1, (int)$row['col_price']) : 0;

            $use_markup   = !empty($row['use_markup']);
            $markup_value = isset($row['markup_value']) ? (float)str_replace(',', '.', (string)$row['markup_value']) : 0.0;
            if ($use_markup) {
                if (!is_finite($markup_value) || $markup_value <= 1.0) $markup_value = 1.01; // minimal valid > 1
            } else {
                $markup_value = 0.0;
            }
            $col_rrp     = isset($row['col_rrp']) ? max(0, (int)$row['col_rrp']) : 0;

            $use_sizes   = !empty($row['use_sizes']);
            $sizes_count = $use_sizes ? max(0, min(20, (int)($row['sizes_count'] ?? 0))) : 0;
            $size_cols   = [];
            if ($use_sizes && !empty($row['size_cols']) && is_array($row['size_cols'])) {
                for ($i=0; $i<$sizes_count; $i++) {
                    $c = isset($row['size_cols'][$i]) ? max(1, (int)$row['size_cols'][$i]) : 0;
                    if ($c <= 0) $errors[] = sprintf(__('Row %d: Size col #%d is invalid.', DITSGSW_TEXT_DOMAIN), $idx+1, $i+1);
                    else $size_cols[] = $c;
                }
                $sizes_count = count($size_cols);
            }

            $use_images = $can_images ? !empty($row['use_images']) : false;
            $col_images = $use_images ? max(1, (int)($row['col_images'] ?? 0)) : 0;

            $use_ai     = $can_ai ? !empty($row['use_ai']) : false;

            // Require minimum essentials: category, url, SKU/Title/Price columns
            if (!$category || !$url) {
                // skip incomplete rows silently
                continue;
            }

            // Generate stable id if missing
            $id = isset($row['id']) && is_string($row['id']) && $row['id'] !== '' ? sanitize_text_field($row['id']) : wp_unique_id('gsw_');

            $out[] = [
                'id'              => $id,
                'category'        => $category,
                'url'             => $url,
                'start_row'       => $start_row,

                'col_status'      => $col_status,
                'col_sku'         => $col_sku,
                'col_title'       => $col_title,
                'col_description' => $col_description,
                'col_price'       => $col_price,

                'use_markup'      => $use_markup,
                'markup_value'    => $markup_value,
                'col_rrp'         => $col_rrp,

                'use_sizes'       => $use_sizes,
                'sizes_count'     => $sizes_count,
                'size_cols'       => $size_cols,

                'use_images'      => $use_images,
                'col_images'      => $col_images,

                'use_ai'          => $use_ai,
            ];
        }
        if ($errors) {
            set_transient('gsw_notice_' . get_current_user_id(), 'error|' . implode(' ', $errors), 90);
            wp_safe_redirect(admin_url('admin.php?page=gsw-importer'));
            exit;
        }
        return $out;
    }

    /**
     * Feature gates based on consent + configuration.
     * These checks are used both in UI (disabled checkboxes) and in sanitizer (server-side enforcement).
     */
    protected static function can_use_images(): bool
    {
        // Google Drive path.
        $g = (array) get_option('gsw_google', []);
        if ( ! empty( $g['consent'] ) && trim( (string) ( $g['service_json'] ?? '' ) ) !== '' ) {
            return true;
        }

        // Web Image Search fallback (no folder required).
        return Web_Image_Search::is_ready();
    }

    protected static function can_use_ai(): bool
    {
        $o = (array) get_option('gsw_openai', []);
        $has_consent = ! empty($o['consent']);
        $has_key     = trim((string)($o['api_key'] ?? '')) !== '';
        $has_model   = trim((string)($o['model'] ?? '')) !== '';
        return $has_consent && $has_key && $has_model;
    }

    protected static function images_disabled_reason(): string
    {
        $g = (array) get_option('gsw_google', []);
        if (empty($g['consent']) || trim((string)($g['service_json'] ?? '')) === '') {
            return __('Images disabled: configure Google Drive (Settings → Google API) OR Pixabay (Settings → Web Image Search).', DITSGSW_TEXT_DOMAIN);
        }
        return '';
    }

    protected static function ai_disabled_reason(): string
    {
        $o = (array) get_option('gsw_openai', []);
        if (empty($o['consent'])) {
            return __('Disabled: please accept OpenAI consent in Settings → OpenAI.', DITSGSW_TEXT_DOMAIN);
        }
        if (trim((string)($o['api_key'] ?? '')) === '') {
            return __('Disabled: please provide OpenAI API key in Settings → OpenAI.', DITSGSW_TEXT_DOMAIN);
        }
        if (trim((string)($o['model'] ?? '')) === '') {
            return __('Disabled: please select OpenAI model in Settings → OpenAI.', DITSGSW_TEXT_DOMAIN);
        }
        return '';
    }

}
