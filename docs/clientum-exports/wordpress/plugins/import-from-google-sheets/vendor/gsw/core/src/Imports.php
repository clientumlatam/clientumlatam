<?php
namespace GSW\Core;

use GSW\Core\Logs;
use GSW\Core\Import_CSV_Data;
use GSW\Core\Insert_Product;
use GSW\Core\Update_Product;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Imports page: renders rows from gsw_import_configs, shows status,
 * handles "Run now", and queues batches via WP-Cron.
 *
 * Important: no dependency on PRO cron implementation.
 */
class Imports
{
    const HOOK_RUN        = 'gsw_run_import';      // cron hook with arg: row id
    const HOOK_PROCESS    = 'gsw_process_batch';   // (args: rowId, jobKey, batchIndex)
    const OPT_ACTIVE_JOBS = 'gsw_active_jobs';     // id => jobKey
    const BATCH_SIZE      = 10;
    const BATCH_DELAY_SEC = 5;

    public static function boot(): void
    {
        add_action( 'admin_post_gsw_run_now', [ self::class, 'handle_run_now' ] );
        add_action( self::HOOK_RUN, [ self::class, 'cron_entrypoint' ], 10, 1 );
        add_action( self::HOOK_PROCESS, [ self::class, 'process_batch' ], 10, 3 );

        add_action( 'admin_post_gsw_cancel_job', [ self::class, 'handle_cancel_job' ] );
        add_action( 'admin_notices', [ self::class, 'maybe_notice' ] );

        add_action( 'admin_enqueue_scripts', [ self::class, 'enqueue_assets' ] );
    }

    /**
     * Enqueue styles/scripts for the Imports admin page.
     */
    public static function enqueue_assets(): void
    {
        if ( ! is_admin() ) return;

        $page = isset( $_GET['page'] ) ? sanitize_key( (string) $_GET['page'] ) : '';
        if ( 'gsw-imports' !== $page ) return;

        wp_enqueue_style(
            'gsw-admin-imports',
            Assets::url( 'gsw-core/admin/imports.css' ),
            [],
            Assets::ver( 'gsw-core/admin/imports.css' )
        );

        wp_enqueue_script(
            'gsw-admin-imports',
            Assets::url( 'gsw-core/admin/imports.js' ),
            [],
            Assets::ver( 'gsw-core/admin/imports.js' ),
            true
        );

        wp_localize_script(
            'gsw-admin-imports',
            'gswImports',
            [
                'autoReloadMs' => 5000,
            ]
        );
    }

    /** helper – read active job manifest (if any) */
    protected static function read_active_manifest( string $id ): ?array
    {
        $jobKey = self::active_job_key( $id );
        if ( ! $jobKey ) {
            return null;
        }
        return self::read_job_file( $jobKey );
    }

    /** Rendered from Admin::render_imports() */
    public static function render_page(): void
    {
        $rows  = get_option( 'gsw_import_configs', [] );
        $state = get_option( 'gsw_import_state', [] );

        echo '<p>' . esc_html__( 'Run imports instantly, view last status, or schedule via Cron.', DITSGSW_TEXT_DOMAIN ) . '</p>';
        echo '<p><label><input type="checkbox" id="gsw-autoimp" /> ' .
            esc_html__( 'Auto refresh every 5s while any job is running', DITSGSW_TEXT_DOMAIN ) .
            '</label></p>';

        echo '<table class="widefat striped"><thead><tr>';
        echo '<th>' . esc_html__( 'Category', DITSGSW_TEXT_DOMAIN ) . '</th>';
        echo '<th>' . esc_html__( 'Google Sheet', DITSGSW_TEXT_DOMAIN ) . '</th>';
        echo '<th>' . esc_html__( 'Status', DITSGSW_TEXT_DOMAIN ) . '</th>';
        echo '<th>' . esc_html__( 'Next Scheduled', DITSGSW_TEXT_DOMAIN ) . '</th>';
        echo '<th>' . esc_html__( 'Actions', DITSGSW_TEXT_DOMAIN ) . '</th>';
        echo '</tr></thead><tbody>';

        if ( empty( $rows ) ) {
            echo '<tr><td colspan="5">' .
                esc_html__( 'No import rows yet. Add them in "Import configuration".', DITSGSW_TEXT_DOMAIN ) .
                '</td></tr>';
        } else {
            foreach ( $rows as $row ) {
                if ( ! is_array( $row ) || empty( $row['id'] ) ) {
                    continue;
                }
                $id   = sanitize_text_field( $row['id'] );
                $cat  = (int) ( $row['category'] ?? 0 );
                $url  = esc_url( $row['url'] ?? '' );
                $st   = $state[ $id ] ?? [ 'last_status' => 'never', 'last_run' => 0, 'last_message' => '' ];

                $cat_label = $cat ? self::cat_label( $cat ) : '—';
                $status    = self::format_status( $id, $st );
                $next      = self::format_next_scheduled( $id );

                echo '<tr>';
                echo '<td>' . $cat_label . '</td>';
                echo '<td><a href="' . esc_url( $url ) . '" target="_blank" rel="noopener noreferrer">' .
                    esc_html( self::shorten( $url ) ) . '</a></td>';
                echo '<td>' . $status . '</td>';
                echo '<td>' . $next . '</td>';
                echo '<td>' . self::actions( $id ) . '</td>';
                echo '</tr>';
            }
        }

        echo '</tbody></table>';
    }

    /** Build actions HTML */
    protected static function actions( string $id ): string
    {
        $run_url = wp_nonce_url(
            admin_url( 'admin-post.php?action=gsw_run_now&id=' . rawurlencode( $id ) ),
            'gsw_run_now_' . $id
        );
        $log_url = admin_url( 'admin.php?page=gsw-logs&row_id=' . rawurlencode( $id ) );
        $sch_url = admin_url( 'admin.php?page=gsw-cron&row_id=' . rawurlencode( $id ) );
        $cancel  = wp_nonce_url(
            admin_url( 'admin-post.php?action=gsw_cancel_job&id=' . rawurlencode( $id ) ),
            'gsw_cancel_job_' . $id
        );

        $out  = '<a class="button button-primary" href="' . esc_url( $run_url ) . '">' .
            esc_html__( 'Run now', DITSGSW_TEXT_DOMAIN ) . '</a> ';
        $out .= '<a class="button" href="' . esc_url( $log_url ) . '">' .
            esc_html__( 'View log', DITSGSW_TEXT_DOMAIN ) . '</a> ';
        $out .= '<a class="button" href="' . esc_url( $sch_url ) . '">' .
            esc_html__( 'Schedule', DITSGSW_TEXT_DOMAIN ) . '</a>';

        if ( self::active_job_key( $id ) ) {
            $out .= '<a class="button button-secondary" href="' . esc_url( $cancel ) . '" onclick="return confirm(\'' .
                esc_js( __( 'Cancel the running job?', DITSGSW_TEXT_DOMAIN ) ) .
                '\');">' . esc_html__( 'Cancel', DITSGSW_TEXT_DOMAIN ) . '</a>';
        }

        return $out;
    }

    public static function handle_cancel_job(): void
    {
        if ( ! ditsgsw_current_user_can_manage() ) {
            wp_die( esc_html__( 'Unauthorized', DITSGSW_TEXT_DOMAIN ) );
        }
        $id = isset( $_GET['id'] ) ? sanitize_text_field( (string) $_GET['id'] ) : '';
        if ( ! $id || ! check_admin_referer( 'gsw_cancel_job_' . $id ) ) {
            wp_die( esc_html__( 'Bad request', DITSGSW_TEXT_DOMAIN ) );
        }

        $key = self::active_job_key( $id );
        if ( $key ) {
            $jobs = (array) get_option( self::OPT_ACTIVE_JOBS, [] );
            unset( $jobs[ $id ] );
            update_option( self::OPT_ACTIVE_JOBS, $jobs, false );
            self::delete_job_file( $key );

            Logs::write( $id, 'warn', 'Job cancelled by user', [ 'job' => $key ] );
            self::save_state( $id, [
                'last_status'  => 'failed',
                'last_run'     => current_time( 'timestamp' ),
                'last_message' => __( 'Cancelled', DITSGSW_TEXT_DOMAIN ),
            ] );
        }

        set_transient(
            'gsw_notice_' . get_current_user_id(),
            'success|' . __( 'Job cancelled.', DITSGSW_TEXT_DOMAIN ),
            60
        );
        wp_safe_redirect( admin_url( 'admin.php?page=gsw-imports' ) );
        exit;
    }

    protected static function shorten( string $url, int $max = 72 ): string
    {
        if ( mb_strlen( $url ) <= $max ) {
            return $url;
        }
        return mb_substr( $url, 0, $max - 1 ) . '…';
    }

    protected static function cat_label( int $term_id ): string
    {
        if ( ! taxonomy_exists( 'product_cat' ) ) {
            return esc_html__( '(WooCommerce missing)', DITSGSW_TEXT_DOMAIN );
        }
        $term = get_term( $term_id, 'product_cat' );
        if ( $term && ! is_wp_error( $term ) ) {
            $link = get_edit_term_link( $term_id, 'product_cat' );
            $name = $term->name ?: ( '#' . $term_id );
            return $link ? '<a href="' . esc_url( $link ) . '">' . esc_html( $name ) . '</a>' : esc_html( $name );
        }
        return '#' . (int) $term_id;
    }

    protected static function format_status( string $rowId, array $st ): string
    {
        $status = esc_html( $st['last_status'] ?? 'never' );
        $cls    = in_array( $status, [ 'never', 'queued', 'running', 'success', 'failed' ], true ) ? $status : 'never';

        $msg  = esc_html( $st['last_message'] ?? '' );
        $time = isset( $st['last_run'] ) && $st['last_run']
            ? date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), (int) $st['last_run'] )
            : '';
        $extra = $time ? ' · ' . $time : '';
        if ( $msg ) {
            $extra .= ' · ' . $msg;
        }

        $prog = '';
        if ( 'running' === $cls ) {
            $man = self::read_active_manifest( $rowId );
            if ( $man && isset( $man['done'], $man['total'] ) ) {
                $done  = (int) $man['done'];
                $total = max( 1, (int) $man['total'] );
                $pct   = (int) floor( $done * 100 / $total );
                $prog  = sprintf(
                    ' <span class="gsw-muted">%d/%d (%d%%)</span>',
                    $done,
                    $total,
                    $pct
                );
            }
        }

        return '<span class="gsw-badge ' . $cls . '">' . $status . '</span>' .
            $prog .
            ( $extra ? '<br/><span class="description">' . $extra . '</span>' : '' );
    }

    protected static function format_next_scheduled( string $id ): string
    {
        $ts = wp_next_scheduled( self::HOOK_RUN, [ $id ] );
        return $ts
            ? esc_html( date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), (int) $ts ) )
            : '—';
    }

    /** Handle "Run now" — queue single event + update state. */
    public static function handle_run_now(): void
    {
        if ( ! ditsgsw_current_user_can_manage() ) {
            wp_die( esc_html__( 'Unauthorized', DITSGSW_TEXT_DOMAIN ) );
        }
        $id = isset( $_GET['id'] ) ? sanitize_text_field( (string) $_GET['id'] ) : '';
        if ( ! $id || ! check_admin_referer( 'gsw_run_now_' . $id ) ) {
            wp_die( esc_html__( 'Bad request', DITSGSW_TEXT_DOMAIN ) );
        }

        $exists = false;
        foreach ( (array) get_option( 'gsw_import_configs', [] ) as $row ) {
            if ( is_array( $row ) && ! empty( $row['id'] ) && $row['id'] === $id ) {
                $exists = true;
                break;
            }
        }
        if ( ! $exists ) {
            self::flash( 'gsw_notice', 'error|' . __( 'Import row not found.', DITSGSW_TEXT_DOMAIN ) );
            wp_safe_redirect( admin_url( 'admin.php?page=gsw-imports' ) );
            exit;
        }

        self::save_state( $id, [
            'last_status'  => 'queued',
            'last_run'     => current_time( 'timestamp' ),
            'last_message' => sprintf(
                __( 'Queued manually by %s', DITSGSW_TEXT_DOMAIN ),
                wp_get_current_user()->user_login
            ),
        ] );

        if ( ! wp_next_scheduled( self::HOOK_RUN, [ $id ] ) ) {
            wp_schedule_single_event( time() + 1, self::HOOK_RUN, [ $id ] );
        }

        self::flash( 'gsw_notice', 'success|' . __( 'Import queued.', DITSGSW_TEXT_DOMAIN ) );
        wp_safe_redirect( admin_url( 'admin.php?page=gsw-imports' ) );
        exit;
    }

    /** Cron entrypoint for a row: start a unique job and schedule first batch. */
    public static function cron_entrypoint( string $id ): void
    {
        $jobKey = self::claim_unique_job( $id );
        if ( '' === $jobKey ) {
            Logs::write( $id, 'warn', 'Job skipped: another job is active for this row' );
            self::save_state( $id, [
                'last_status'  => 'failed',
                'last_run'     => current_time( 'timestamp' ),
                'last_message' => __( 'Already running.', DITSGSW_TEXT_DOMAIN ),
            ] );
            return;
        }

        self::save_state( $id, [
            'last_status'  => 'running',
            'last_run'     => current_time( 'timestamp' ),
            'last_message' => __( 'Starting queue...', DITSGSW_TEXT_DOMAIN ),
        ] );
        Logs::write( $id, 'info', 'Queue starting', [ 'job' => $jobKey ] );

        $cfg = self::get_config_row( $id );
        if ( ! $cfg ) {
            Logs::write( $id, 'error', 'Config row not found, aborting', [ 'job' => $jobKey ] );
            self::finish_job( $id, $jobKey, false, 'Config not found' );
            return;
        }

        $res = Import_CSV_Data::fetch_minimal( $cfg );
        if ( ! empty( $res['error'] ) ) {
            Logs::write( $id, 'error', 'Source fetch failed: ' . $res['error'], [ 'job' => $jobKey ] );
            self::finish_job( $id, $jobKey, false, 'Fetch error' );
            return;
        }

        $items = (array) ( $res['items'] ?? [] );
        if ( empty( $items ) ) {
            Logs::write( $id, 'warn', 'No rows to import', [ 'job' => $jobKey ] );
            self::finish_job( $id, $jobKey, true, 'No rows' );
            return;
        }

        $manifest = [
            'job'     => $jobKey,
            'row_id'  => $id,
            'created' => time(),
            'total'   => count( $items ),
            'done'    => 0,
            'cfg'     => [
                'use_markup'   => ! empty( $cfg['use_markup'] ),
                'markup_value' => (float) ( $cfg['markup_value'] ?? 0 ),
                'use_sizes'    => ! empty( $cfg['use_sizes'] ),
                'sizes_count'  => (int) ( $cfg['sizes_count'] ?? 0 ),
                'use_images'   => ! empty( $cfg['use_images'] ),
                'use_ai'       => ! empty( $cfg['use_ai'] ),
                'category'     => (int) ( $cfg['category'] ?? 0 ),
            ],
            'items'   => $items,
        ];

        $ok = self::write_job_file( $jobKey, $manifest );
        if ( ! $ok ) {
            Logs::write( $id, 'error', 'Failed to persist job file', [ 'job' => $jobKey ] );
            self::finish_job( $id, $jobKey, false, 'Job file error' );
            return;
        }

        Logs::write( $id, 'info', 'Scheduling batch #0', [ 'job' => $jobKey ] );
        wp_schedule_single_event( time() + 1, self::HOOK_PROCESS, [ $id, $jobKey, 0 ] );
    }

    /** Process Nth batch (10 items) */
    public static function process_batch( string $id, string $jobKey, int $batchIndex ): void
    {
        $activeKey = self::active_job_key( $id );
        if ( $activeKey !== $jobKey ) {
            Logs::write( $id, 'warn', 'Batch aborted: job key mismatch', [ 'job' => $jobKey, 'active' => $activeKey ] );
            return;
        }

        $man = self::read_job_file( $jobKey );
        if ( ! $man ) {
            Logs::write( $id, 'error', 'Batch aborted: job file missing', [ 'job' => $jobKey ] );
            self::finish_job( $id, $jobKey, false, 'Job file missing' );
            return;
        }
        $man['done'] = isset( $man['done'] ) ? (int) $man['done'] : 0;

        $total = (int) ( $man['total'] ?? 0 );
        $start = $batchIndex * self::BATCH_SIZE;
        $end   = min( $total, $start + self::BATCH_SIZE );

        if ( $start >= $total ) {
            Logs::write( $id, 'info', 'All batches done', [ 'job' => $jobKey ] );
            self::finish_job( $id, $jobKey, true, 'Completed' );
            return;
        }

        Logs::write(
            $id,
            'info',
            'Processing batch',
            [ 'job' => $jobKey, 'batch' => $batchIndex, 'range' => "$start.." . ( $end - 1 ) ]
        );

        $status      = new Stock_Status();
        $salePercent = $status->salePercent();

        for ( $i = $start; $i < $end; $i++ ) {
            $src = $man['items'][ $i ] ?? null;
            if ( ! $src || ! is_array( $src ) ) {
                continue;
            }

            $rowNo = (int) ( $src['row_index'] ?? $i + 1 );

            $sku   = trim( (string) ( $src['sku'] ?? '' ) );
            $title = trim( (string) ( $src['title'] ?? '' ) );
            $desc  = trim( (string) ( $src['description'] ?? '' ) );
            $priceRaw = $src['price'] ?? null;
            $price = is_numeric( $priceRaw ) ? (float) $priceRaw : 0.0;

            $statusText = (string) ( $src['status_text'] ?? '' );
            $st         = $status->resolve_status( $statusText );

            if ( '' === $sku ) {
                Logs::write( $id, 'error', 'Row skipped: missing SKU', [ 'row' => $rowNo, 'i' => $i ] );
                continue;
            }

            $useMarkup   = ! empty( $man['cfg']['use_markup'] );
            $markupValue = (float) ( $man['cfg']['markup_value'] ?? 0 );
            $rrpRaw      = (string) ( $src['rrp_raw'] ?? '' );
            $rrpMin      = (float) ( $src['rrp_min'] ?? '' );
            $rrpMax      = (float) ( $src['rrp_max'] ?? '' );

            // If markup is enabled/configured, a missing or zero price is invalid and must be skipped.
            if ( $useMarkup && $markupValue > 0 && ( ! is_numeric( $priceRaw ) || $price <= 0 ) ) {
                Logs::write(
                    $id,
                    'info',
                    'PRICE | Skip import: markup enabled and source price is empty/zero',
                    [ 'row' => $rowNo, 'sku' => $sku, 'price_raw' => (string) ( $src['price_raw'] ?? '' ) ]
                );
                continue;
            }

            if ( $useMarkup && $markupValue > 1.0 ) {
                $price = $price * $markupValue;
            }

            if ( '' !== $rrpRaw ) {
                if ( $rrpMin && $rrpMax ) {
                    $min = $rrpMin;
                    $max = $rrpMax;
                    if ( $min > $max ) {
                        $t   = $min;
                        $min = $max;
                        $max = $t;
                    }
                    $price = max( $min, min( $price, $max ) );
                }
            }

            $sizes = [];
            if ( ! empty( $man['cfg']['use_sizes'] ) && ! empty( $src['sizes_raw'] ) ) {
                foreach ( (array) $src['sizes_raw'] as $sz ) {
                    $sz = trim( (string) $sz );
                    if ( '' === $sz ) {
                        continue;
                    }
                    $parsed   = $status->parse_size( $sz );
                    $sizes[] = $parsed;
                }
            }

            if ( ! empty( $man['cfg']['use_images'] ) ) {
                $folderSpec = trim( (string) ( $src['images_folder'] ?? '' ) );

                if ( '' === $folderSpec ) {
                    // No Google Drive folder — only proceed if Web Image Search is configured.
                    if ( ! \GSW\Core\Web_Image_Search::is_ready() ) {
                        Logs::write(
                            $id,
                            'info',
                            'IMAGES | Skip import: images enabled but folder is empty and Web Image Search is not configured',
                            [ 'row' => $rowNo, 'sku' => $sku ]
                        );
                        continue;
                    }
                    // Web Image Search will handle it inside Insert_Product::create().
                } else {
                    // Google Drive folder provided — pre-check it has images.
                    $g     = (array) get_option( 'gsw_google', [] );
                    $limit = (int) ( $g['count_image'] ?? $g['count_images'] ?? 6 );
                    $limit = max( 1, min( 20, $limit ) );
                    $available = Image_Import::count_for_folder( $folderSpec, $limit, $id );

                    if ( $available <= 0 ) {
                        Logs::write(
                            $id,
                            'info',
                            'IMAGES | Skip import: folder has no valid images or is not accessible',
                            [ 'row' => $rowNo, 'sku' => $sku, 'folder' => $folderSpec ]
                        );
                        continue;
                    }
                }
            }

            $regular = $price;
            $sale    = null;
            if ( 'sale' === $st ) {
                $sale    = $price;
                $regular = round( $sale * ( 1 + $salePercent / 100 ), 2 );
            }

            $normalized = [
                'row'           => $rowNo,
                'sku'           => $sku,
                'title'         => $title,
                'description'   => $desc,
                'status'        => $st,
                'price_regular' => $regular,
                'price_sale'    => $sale,
                'sizes'         => $sizes,
                'images_folder' => (string) ( $src['images_folder'] ?? '' ),
                'category_id'   => (int) ( $man['cfg']['category'] ?? 0 ),
                'use_ai'        => ! empty( $man['cfg']['use_ai'] ),
                'use_images'    => ! empty( $man['cfg']['use_images'] ),
            ];

            $product_id = wc_get_product_id_by_sku( $normalized['sku'] );
            if ( ! $product_id && 'sold' === $st ) {
                Logs::write(
                    $id,
                    'info',
                    'SOLD | Skip insert: status is Sold',
                    [ 'row' => $rowNo, 'sku' => $normalized['sku'] ]
                );
                continue;
            }

            if ( ! $product_id ) {
                $newId = Insert_Product::create( $normalized, $id );
                if ( $newId ) {
                    Logs::write(
                        $id,
                        'info',
                        'INSERT done',
                        [ 'row' => $rowNo, 'sku' => $normalized['sku'], 'id' => $newId ]
                    );
                } else {
                    Logs::write(
                        $id,
                        'error',
                        'INSERT failed',
                        [ 'row' => $rowNo, 'sku' => $normalized['sku'] ]
                    );
                }
            } else {
                $ok = Update_Product::apply( $normalized, (int) $product_id, $id );
                if ( $ok ) {
                    Logs::write(
                        $id,
                        'info',
                        'UPDATE done',
                        [ 'row' => $rowNo, 'sku' => $normalized['sku'], 'id' => $product_id ]
                    );
                } else {
                    Logs::write(
                        $id,
                        'error',
                        'UPDATE failed',
                        [ 'row' => $rowNo, 'sku' => $normalized['sku'], 'id' => $product_id ]
                    );
                }
            }

            $man['done']++;
            self::write_job_file( $jobKey, $man );
        }

        $next = $batchIndex + 1;
        if ( $next * self::BATCH_SIZE < $total ) {
            Logs::write(
                $id,
                'info',
                'Scheduling next batch',
                [ 'job' => $jobKey, 'next_batch' => $next ]
            );
            wp_schedule_single_event( time() + self::BATCH_DELAY_SEC, self::HOOK_PROCESS, [ $id, $jobKey, $next ] );
        } else {
            Logs::write( $id, 'info', 'Last batch completed', [ 'job' => $jobKey ] );
            self::finish_job( $id, $jobKey, true, 'All rows processed' );
        }
    }

    /** Claim a unique job key for row id or return empty string if busy. */
    protected static function claim_unique_job( string $id ): string
    {
        $jobs = (array) get_option( self::OPT_ACTIVE_JOBS, [] );
        if ( ! empty( $jobs[ $id ] ) ) {
            return '';
        }
        $key        = 'gswj_' . wp_generate_uuid4();
        $jobs[ $id ] = $key;
        update_option( self::OPT_ACTIVE_JOBS, $jobs, false );
        return $key;
    }

    /** Return active job key for id or empty string. */
    protected static function active_job_key( string $id ): string
    {
        $jobs = (array) get_option( self::OPT_ACTIVE_JOBS, [] );
        return (string) ( $jobs[ $id ] ?? '' );
    }

    /**
    * Finish job: cleanup, update state, notify listeners.
    *
    * IMPORTANT: The Free core no longer recognizes the Cron class.
    * The PRO plugin may crash on gsw_import_finished and reschedule rules.
    */
    protected static function finish_job( string $id, string $jobKey, bool $success, string $message ): void
    {
        $jobs = (array) get_option( self::OPT_ACTIVE_JOBS, [] );
        if ( isset( $jobs[ $id ] ) && $jobs[ $id ] === $jobKey ) {
            unset( $jobs[ $id ] );
            update_option( self::OPT_ACTIVE_JOBS, $jobs, false );
        }

        self::delete_job_file( $jobKey );

        self::save_state( $id, [
            'last_status'  => $success ? 'success' : 'failed',
            'last_run'     => current_time( 'timestamp' ),
            'last_message' => $message,
        ] );

        /** 
        * Fired when an import job finishes (successfully or with error). 
        * 
        * Used by PRO-cron for re-scaling rules. 
        * 
        * @param string $id Import row ID. 
        * @param string $jobKey Internal job key. 
        * @param bool $success True on success, false on error. 
        * @param string $message Human-readable summary. 
        */
        do_action( 'gsw_import_finished', $id, $jobKey, $success, $message );
    }

    protected static function get_config_row( string $id ): ?array
    {
        foreach ( (array) get_option( 'gsw_import_configs', [] ) as $row ) {
            if ( is_array( $row ) && ! empty( $row['id'] ) && $row['id'] === $id ) {
                return $row;
            }
        }
        return null;
    }

    /** ---------- Job file helpers ---------- */

    protected static function jobs_dir(): string
    {
        $up = wp_get_upload_dir();
        return trailingslashit( $up['basedir'] ) . 'gsw-importer/jobs';
    }

    protected static function job_path( string $jobKey ): string
    {
        return trailingslashit( self::jobs_dir() ) . sanitize_file_name( $jobKey ) . '.json';
    }

    protected static function ensure_jobs_dir(): void
    {
        $dir = self::jobs_dir();
        if ( ! is_dir( $dir ) ) {
            @wp_mkdir_p( $dir );
        }
    }

    protected static function write_job_file( string $jobKey, array $data ): bool
    {
        self::ensure_jobs_dir();
        $path = self::job_path( $jobKey );
        $json = wp_json_encode( $data, JSON_UNESCAPED_UNICODE );

        $fh = @fopen( $path, 'wb' ); // phpcs:ignore
        if ( ! $fh ) {
            return false;
        }
        @fwrite( $fh, $json ); // phpcs:ignore
        @fclose( $fh );        // phpcs:ignore
        return true;
    }

    protected static function read_job_file( string $jobKey ): ?array
    {
        $path = self::job_path( $jobKey );
        if ( ! file_exists( $path ) ) {
            return null;
        }
        $json = @file_get_contents( $path ); // phpcs:ignore
        if ( false === $json ) {
            return null;
        }
        $data = json_decode( $json, true );
        return is_array( $data ) ? $data : null;
    }

    protected static function delete_job_file( string $jobKey ): void
    {
        $path = self::job_path( $jobKey );
        if ( file_exists( $path ) ) {
            @unlink( $path ); // phpcs:ignore
        }
    }

    protected static function save_state( string $id, array $patch ): void
    {
        $state         = get_option( 'gsw_import_state', [] );
        $curr          = $state[ $id ] ?? [ 'last_status' => 'never', 'last_run' => 0, 'last_message' => '' ];
        $state[ $id ] = array_merge( $curr, $patch );
        update_option( 'gsw_import_state', $state, false );
    }

    protected static function flash( string $key, string $value ): void
    {
        set_transient( $key . '_' . get_current_user_id(), $value, 60 );
    }

    public static function maybe_notice(): void
    {
        $key = 'gsw_notice_' . get_current_user_id();
        $val = get_transient( $key );
        if ( ! $val ) {
            return;
        }
        delete_transient( $key );

        list( $type, $msg ) = array_pad( explode( '|', (string) $val, 2 ), 2, '' );
        $class               = 'notice-info';
        if ( 'success' === $type ) {
            $class = 'notice-success';
        } elseif ( 'error' === $type ) {
            $class = 'notice-error';
        }

        echo '<div class="notice ' . esc_attr( $class ) . ' is-dismissible"><p>' .
            esc_html( $msg ) . '</p></div>';
    }
}
