<?php
namespace GSW\Core;

use GSW\Core\Logs;

if (!defined('ABSPATH')) exit;

/**
 * Fetch and parse CSV for a given import config row.
 * - Supports direct CSV links and Google Sheets links (converted to export CSV).
 * - Returns a light normalized array with only relevant columns.
 */
class Import_CSV_Data
{
    /**
     * Main entry point: fetch CSV and return normalized items.
     *
     * @param array $cfg Import config row
     * @return array{items:array<int,array>, error:string}
     */
    public static function fetch_minimal(array $cfg): array
    {
        $url = isset($cfg['url']) ? (string)$cfg['url'] : '';
        if (!$url) return ['items' => [], 'error' => 'Empty URL'];

        // Use row id (if exists) for log filtering on Logs page
        $rowId = isset($cfg['id']) ? (string) $cfg['id'] : '';

        $csvUrl = self::to_csv_url($url);
        $resp = wp_remote_get($csvUrl, ['timeout' => 20, 'redirection' => 5]);
        if (is_wp_error($resp)) {
            return ['items' => [], 'error' => $resp->get_error_message()];
        }
        $code = (int) wp_remote_retrieve_response_code($resp);
        if ($code < 200 || $code >= 300) {
            return ['items' => [], 'error' => 'HTTP ' . $code];
        }
        $body = (string) wp_remote_retrieve_body($resp);
        if ($body === '') {
            return ['items' => [], 'error' => 'Empty body'];
        }

        // 1-based column accessor (CSV config is 1-based, arrays are 0-based)
        $get = function(array $line, int $col): string {
            if ($col <= 0) return '';
            $i = $col - 1;
            return isset($line[$i]) ? trim((string)$line[$i]) : '';
        };

        // Columns from config (read once)
        $items = [];
        $statusCol = (int)($cfg['col_status'] ?? 0);
        $skuCol    = (int)($cfg['col_sku'] ?? 0);
        $titleCol  = (int)($cfg['col_title'] ?? 0);
        $descCol   = (int)($cfg['col_description'] ?? 0);
        $priceCol  = (int)($cfg['col_price'] ?? 0);
        $rrpCol    = (int)($cfg['col_rrp'] ?? 0);

        $useSizes   = !empty($cfg['use_sizes']);
        $sizesCount = (int)($cfg['sizes_count'] ?? 0);
        $sizeCols   = is_array($cfg['size_cols'] ?? null) ? array_values($cfg['size_cols']) : [];

        $useImages  = !empty($cfg['use_images']);
        $imagesCol  = (int)($cfg['col_images'] ?? 0);

        [$body, $delim] = self::prepare_csv_body_and_delimiter($body, $cfg['delimiter'] ?? null);

        $fh = fopen('php://temp', 'r+');
        fwrite($fh, $body);
        rewind($fh);

        $startRow = max(1, (int)($cfg['start_row'] ?? 1));

        // Strictly skip rows before start_row (no O(n²) shifting)
        for ($i = 1; $i < $startRow; $i++) {
            if (fgetcsv($fh, 0, $delim, '"', '\\') === false) {
                fclose($fh);
                return ['items' => [], 'error' => 'CSV ended before start_row'];
            }
        }

        $items = [];
        $rowIndex = $startRow;

        // Tune logging to avoid DB/IO choke
        $logEvery = (int)($cfg['log_every'] ?? 50);        // log every Nth row
        $maxDescLog = (int)($cfg['max_desc_log'] ?? 50);  // truncate description in logs

        while (($line = fgetcsv($fh, 0, $delim, '"', '\\')) !== false) {
            if (!is_array($line)) { $rowIndex++; continue; }

            // 1-based column accessor
            $get = static function(array $line, int $col): string {
                if ($col <= 0) return '';
                $i = $col - 1;
                return isset($line[$i]) ? trim((string)$line[$i]) : '';
            };

            // Columns from config
            $statusCol = (int)($cfg['col_status'] ?? 0);
            $skuCol    = (int)($cfg['col_sku'] ?? 0);
            $titleCol  = (int)($cfg['col_title'] ?? 0);
            $descCol   = (int)($cfg['col_description'] ?? 0);
            $priceCol  = (int)($cfg['col_price'] ?? 0);
            $rrpCol    = (int)($cfg['col_rrp'] ?? 0);
            $useSizes  = !empty($cfg['use_sizes']);
            $sizesCount = (int)($cfg['sizes_count'] ?? 0);
            $sizeCols   = is_array($cfg['size_cols'] ?? null) ? array_values($cfg['size_cols']) : [];
            if (empty($sizeCols) && !empty($cfg['sizes_start_col']) && $sizesCount > 0) {
                $start = (int)$cfg['sizes_start_col'];
                for ($i = 0; $i < $sizesCount; $i++) $sizeCols[] = $start + $i;
            }
            $useImages  = !empty($cfg['use_images']);
            $imagesCol  = (int)($cfg['col_images'] ?? 0);

            $priceRaw = $get($line, $priceCol);
            $price    = self::parse_price_to_float($priceRaw);

            $rrpRaw   = $rrpCol > 0 ? $get($line, $rrpCol) : '';
            [$rrpMin, $rrpMax] = self::parse_price_range($rrpRaw);

            $item = [
                'row_index'     => $rowIndex,
                'status_text'   => $get($line, $statusCol),
                'sku'           => $get($line, $skuCol),
                'title'         => $get($line, $titleCol),
                'description'   => $get($line, $descCol),
                'price_raw'     => $priceRaw,
                'price'         => $price,
                'rrp_raw'       => $rrpRaw,
                'rrp_min'       => $rrpMin,
                'rrp_max'       => $rrpMax,
                'sizes_raw'     => [],
                'images_folder' => $useImages ? $get($line, $imagesCol) : '',
            ];

            if ($useSizes && $sizesCount > 0) {
                foreach ($sizeCols as $c) $item['sizes_raw'][] = $get($line, (int)$c);
                // Keep each source cell as a single size value.
                // Values like "XS/S/M" or "34 A/B (75A/B), трусики S" are one logical size entry,
                // so splitting by "/" would corrupt size parsing and adjacent size columns.
                $item['sizes_raw'] = array_pad(array_slice($item['sizes_raw'], 0, $sizesCount), $sizesCount, '');
            }

            // Skip fully empty rows
            if ($item['sku'] === '' && $item['title'] === '' && ($item['price_raw'] === '' || $item['price'] === null)) {
                $rowIndex++;
                continue;
            }

            // Throttled, safe logging
                $descLog = $item['description'];
                if ($maxDescLog > 0 && mb_strlen($descLog) > $maxDescLog) {
                    $descLog = mb_substr($descLog, 0, $maxDescLog) . '…';
                }
                Logs::write(
                    0,
                    'info',
                    sprintf(
                        'Row %d | status:%s | sku:%s | title:%s | price:%s | rrp:[%s..%s] | sizes:[%s] | desc:%s | images:%s',
                        $item['row_index'],
                        $item['status_text'],
                        $item['sku'],
                        $item['title'],
                        ($item['price'] !== null ? (string)$item['price'] : 'null'),
                        ($item['rrp_min'] !== null ? (string)$item['rrp_min'] : 'null'),
                        ($item['rrp_max'] !== null ? (string)$item['rrp_max'] : 'null'),
                        implode(' | ', array_filter($item['sizes_raw'], fn($v) => $v !== '')),
                        $descLog,
                        $item['images_folder']
                    ),
                    [
                        'row'    => $item['row_index'],
                        'sku'    => $item['sku'],
                        'title'  => $item['title'],
                        'price'  => $item['price'],
                        'rrp'    => ['min' => $item['rrp_min'], 'max' => $item['rrp_max']],
                        'sizes'  => $item['sizes_raw'],
                    ]
                );

            $items[] = $item;
            $rowIndex++;
        }

        fclose($fh);

        return ['items' => $items, 'error' => ''];
    }

    /**
     * Convert a Google Sheets link to a CSV export link (when possible).
     */
    protected static function to_csv_url(string $url): string
    {
        // Quick heuristics:
        if (strpos($url, 'docs.google.com/spreadsheets') !== false) {
            // Try to extract gid
            $gid = '';
            if (preg_match('~[#&?]gid=([0-9]+)~', $url, $m)) $gid = $m[1];
            if (preg_match('~/spreadsheets/d/([^/]+)/~', $url, $m)) {
                $id = $m[1];
                $q  = $gid !== '' ? ('&gid=' . rawurlencode($gid)) : '';
                return 'https://docs.google.com/spreadsheets/d/' . $id . '/export?format=csv' . $q;
            }
            // fallback
            if (strpos($url, 'output=csv') === false) {
                $url .= (strpos($url, '?') !== false ? '&' : '?') . 'output=csv';
            }
        }
        return $url;
    }

    /**
     * Prepare CSV body:
     * - Strip UTF-8 BOM
     * - Detect Excel "sep=;" marker
     * - Apply delimiter override if provided
     *
     * @return array{0:string,1:string} [csvBody, delimiterChar]
     */
    protected static function prepare_csv_body_and_delimiter(string $csv, ?string $overrideDelim): array
    {
        // Strip BOM
        if (strncmp($csv, "\xEF\xBB\xBF", 3) === 0) $csv = substr($csv, 3);

        // Excel sep marker
        $detected = null;
        if (preg_match('/^sep=([,;])\R/i', $csv, $m)) {
            $detected = $m[1];
            $csv = preg_replace('/^sep=[,;]\R/i', '', $csv, 1);
        }

        if (!empty($overrideDelim)) return [$csv, (string)$overrideDelim];
        if ($detected) return [$csv, $detected];

        // Simple guess from first non-empty line
        $firstLine = strtok($csv, "\r\n");
        $delim = (substr_count((string)$firstLine, ';') > substr_count((string)$firstLine, ',')) ? ';' : ',';
        return [$csv, $delim];
    }

     /**
     * Parse a localized price string to float (supports spaces, NBSP, thousands, comma/dot decimals).
     */
    protected static function parse_price_to_float(?string $str): ?float
    {
        $s = trim((string)$str);
        if ($s === '') return null;

        // Remove spaces and NBSP, keep digits, comma, dot, minus
        $s = str_replace(["\xC2\xA0", ' '], '', $s);
        $s = preg_replace('/[^\d.,\-]/u', '', $s);
        if ($s === '' || $s === '-' || $s === ',') return null;

        $hasComma = strpos($s, ',') !== false;
        $hasDot   = strpos($s, '.') !== false;

        if ($hasComma && $hasDot) {
            // Last separator is decimal; the other is thousands
            $lastComma = strrpos($s, ',');
            $lastDot   = strrpos($s, '.');
            $decimalSep = ($lastComma > $lastDot) ? ',' : '.';
            $thousandSep = $decimalSep === ',' ? '.' : ',';
            $s = str_replace($thousandSep, '', $s);
            $s = str_replace($decimalSep, '.', $s);
        } elseif ($hasComma) {
            // Heuristic: ",ddd" at end is likely thousands separator
            if (preg_match('/,\d{3}$/', $s)) {
                $s = str_replace(',', '', $s);
            } else {
                $s = str_replace(',', '.', $s);
            }
        } else {
            // Only dot or none; if ".ddd" at end, likely thousands separator
            if (preg_match('/\.\d{3}$/', $s)) {
                $s = str_replace('.', '', $s);
            }
        }

        return is_numeric($s) ? (float)$s : null;
    }

   /**
     * Parse price range like "100-200", "100 – 200", "100—200" to [min, max];
     * single value -> [v, v].
     *
     * @return array{0:?float,1:?float}
     */
    protected static function parse_price_range(?string $str): array
    {
        $raw = trim((string)$str);
        if ($raw === '') return [null, null];

        // Split by hyphen / en dash / em dash with optional spaces
        $parts = preg_split('/\s*[-–—]\s*/u', $raw);
        if (!$parts || count($parts) === 0) return [null, null];

        if (count($parts) === 1) {
            $v = self::parse_price_to_float($parts[0]);
            return [$v, $v];
        }

        $min = self::parse_price_to_float($parts[0]);
        $max = self::parse_price_to_float($parts[1]);
        return [$min, $max];
    }
}
