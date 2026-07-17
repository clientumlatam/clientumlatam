<?php
namespace GSW\Core;

if (!defined('ABSPATH')) exit;

/**
 * Resolves product status against the synonyms configured in:
 * Settings → Product Statuses.
 *
 * Notes:
 * - Normalizes input (mb_strtolower + trim + unicode cleanup).
 * - Matches by substring: if any token is found anywhere in the string, it is a match.
 */
class Stock_Status
{
    protected array $map;
    protected int $salePercent;

    public function __construct()
    {
        $opt = (array) get_option('gsw_statuses', []);
        $this->map = [
            'in_stock' => $this->explode_tokens($opt['in_stock'] ?? ''),
            'sale'     => $this->explode_tokens($opt['sale'] ?? ''),
            'waiting'  => $this->explode_tokens($opt['waiting'] ?? ''),
            'sold'     => $this->explode_tokens($opt['sold'] ?? ''),
        ];
        $this->salePercent = isset($opt['sale_percent']) ? max(0, min(90, (int)$opt['sale_percent'])) : 10;
    }

    public function salePercent(): int
    {
        return $this->salePercent;
    }

    /** Return one of: in_stock|sale|waiting|sold|unknown */
    public function resolve_status(string $text): string
    {
        $t = $this->norm($text);
        if ($this->has_any($t, $this->map['sale']))     return 'sale';
        if ($this->has_any($t, $this->map['in_stock'])) return 'in_stock';
        if ($this->has_any($t, $this->map['waiting']))  return 'waiting';
        if ($this->has_any($t, $this->map['sold']))     return 'sold';
        return 'unknown';
    }

    /**
     * Parse a size label that may include a status and/or quantity.
     *
     * Examples:
     * - "M (waiting)"
     * - "42 - sold"
     * - "2XL (1 pcs)"
     *
     * @return array{name:string,status:string,qty:int|null}
     */
    public function parse_size(string $size): array
    {
        $raw = trim($size);

        $status = $this->resolve_status($raw);

        // Extract quantity markers like "(1 pcs)" or "pcs 2" and strip them from the string.
        [$qty, $raw] = $this->extract_qty_and_strip($raw);

        // Remove bracketed parts: "(...)", "[...]", "{...}"
        $name = trim(preg_replace('~[\(\[\{].*?[\)\]\}]~u', '', $raw));
         // Remove trailing "- status" 
        $name = trim(preg_replace('~\s*-\s*(in stock|sale|waiting|sold).*$~ui', '', $name));

        // Normalize Cyrillic "Х/х" to Latin "X/x" etc. (e.g. "2ХL" -> "2XL")
        $name = $this->normalize_size_name($name);

        return [
            'name'   => $name !== '' ? $name : $size,
            'status' => $status,
            'qty'    => $qty, // int|null
        ];
    }

    protected function explode_tokens(string $csv): array
    {
        $parts = array_filter(array_map(function($v){
            $v = trim($v);
            return $v !== '' ? $this->norm($v) : '';
        }, explode(',', (string)$csv)));
        return array_values(array_unique($parts));
    }

    /**
     * Universal string normalization:
     * - converts fullwidth to ASCII, exotic spaces to regular spaces
     * - unifies dashes/minuses to "-"
     * - unifies quotation marks to " and '
     * - removes soft hyphens / zero-width chars / BOM
     * - replaces "ё" with "е"
     * - converts to lowercase and collapses whitespace
     */
    protected function norm(string $s): string
    {
        $s = trim($s);

        //  Fullwidth ASCII → halfwidth (ＡＢＣ１２３ → ABC123)
        if (function_exists('mb_convert_kana')) {
            $s = mb_convert_kana($s, 'as', 'UTF-8'); // a: alphabet, s: space
        }

        // Normalize spaces (NBSP, thin spaces, etc.) → regular space
        $s = str_replace(
            [
                "\xC2\xA0", // NBSP
                "\xE2\x80\xAF", // NARROW NBSP
                "\xE2\x80\x83", "\xE2\x80\x84", "\xE2\x80\x85", "\xE2\x80\x86",
                "\xE2\x80\x87", "\xE2\x80\x88", "\xE2\x80\x89", "\xE2\x80\x8A", // En/Em/figure/thin spaces
            ],
            ' ',
            $s
        );

        // Remove zero-width / soft hyphen / BOM
        $s = str_replace(
            [
                "\xC2\xAD", // soft hyphen
                "\xEF\xBB\xBF", // BOM
                "\xE2\x80\x8B", // ZWSP
                "\xE2\x80\x8C", // ZWNJ
                "\xE2\x80\x8D", // ZWJ
                "\xE1\xA0\x8E", // MONGOLIAN VOWEL SEPARATOR
            ],
            '',
            $s
        );

        // Normalize dashes/minuses -> "-"
        $s = strtr($s, [
            '–' => '-', '—' => '-', '−' => '-', '-' => '-', '‒' => '-', '﹘' => '-', '﹣' => '-', '－' => '-',
        ]);

        // Normalize quotes
        $s = strtr($s, [
            '“' => '"', '”' => '"', '„' => '"', '«' => '"', '»' => '"', '‟' => '"',
            '’' => "'", '‘' => "'", '‚' => "'", '‹' => "'", '›' => "'", '′' => "'",
            '＇' => "'", // fullwidth apostrophe
        ]);

        // Frequently encountered special characters
        $s = strtr($s, [
            'ё' => 'е', 'Ё' => 'Е',
            '×' => 'x', // multiplication sign → "x" (useful for "2x")
            '／' => '/', '⁄' => '/', '⧸' => '/', // slash variants
            '：' => ':', '，' => ',', '、' => ',', '。' => '.', '·' => '.', '•' => '.',
        ]);

        // Lowercase
        $s = mb_strtolower($s, 'UTF-8');

        // Collapse whitespace
        $s = preg_replace('~\s+~u', ' ', $s);

        return trim($s);
    }
    /**
     * Size name normalization:
     * - cleans spaces/dashes similarly to norm(), but does NOT lowercase
     * - Cyrillic Х/х and Roman Ⅹ/ⅹ → Latin X/x
     * - collapses spaces and removes them inside size labels ("2 XL" → "2XL")
     * - uppercases the result for consistency
     */
    protected function normalize_size_name(string $s): string
    {
        $s = trim($s);

        // Basic cleaning (without lowercase)
        if (function_exists('mb_convert_kana')) {
            $s = mb_convert_kana($s, 'as', 'UTF-8');
        }
        $s = str_replace(
            [
                "\xC2\xA0", "\xE2\x80\xAF",
                "\xE2\x80\x83","\xE2\x80\x84","\xE2\x80\x85","\xE2\x80\x86",
                "\xE2\x80\x87","\xE2\x80\x88","\xE2\x80\x89","\xE2\x80\x8A",
                "\xC2\xAD", "\xEF\xBB\xBF", "\xE2\x80\x8B", "\xE2\x80\x8C", "\xE2\x80\x8D",
            ],
            [' ', ' ', ' ',' ',' ',' ',' ',' ',' ',' ', '', '', '', '', ''],
            $s
        );
        $s = strtr($s, [
            '–' => '-', '—' => '-', '−' => '-', '-' => '-', '‒' => '-', '﹘' => '-', '﹣' => '-', '－' => '-',
        ]);

        // X/x (Cyrillic) and Ⅹ/ⅹ (Roman) → Latin X/x
        $s = strtr($s, [
            'Х' => 'X', 'х' => 'x',
            'Ⅹ' => 'X', 'ⅹ' => 'x',
        ]);

        // extra spaces
        $s = preg_replace('/\s+/u', ' ', trim($s));

        // sizes are usually written without spaces: "2 XL" → "2XL"
        $s = str_replace(' ', '', $s);

        // for consistency - uppercase
        $s = mb_strtoupper($s, 'UTF-8');

        return $s;
    }
    /**
     * Extracts quantity markers (units) and strips them from the original string.
     *
     * Supported forms:
     * - "(1 pcs)", "[1pcs.]", "{pcs 1}"
     * - "1 pcs", "pcs 1"
     * - "(1 шт)", "[1шт.]", "{шт 1}"
     *
     * Returns: [qty|null, strippedString]
     *
     * @return array{0:int|null,1:string}
     */
    protected function extract_qty_and_strip(string $s): array
    {
        $units = $this->get_qty_units(); // ['шт','шт.','pcs',...]
        $unitRegex = '(?:' . implode('|', array_map(fn($u) => preg_quote($u, '/'), $units)) . ')';

        $work = $s;

        // NBSP / narrow NBSP -> regular space
        $work = str_replace(["\xC2\xA0", "\xE2\x80\xAF"], ' ', $work);

        // Optionally normalize non-latin digits to 0-9 if such helper exists
        if (method_exists($this, 'norm_digits')) {
            $work = $this->norm_digits($work);
        }

        $qty = null;

        // === Case #0: Quantity inside brackets ===
        // Match one full bracket group and extract the number from it.
        $patBracket = '/
            [\(\[\{]                              # opening bracket
            \s*
            (?:                                   # num+unit OR unit+num
                (\d{1,5})\s*' . $unitRegex . '
            |
                ' . $unitRegex . '\s*(\d{1,5})
            )
            \s*
            [\)\]\}]                              # closing bracket
        /iux';

        if (preg_match($patBracket, $work, $m, PREG_OFFSET_CAPTURE)) {
            // Number is in group 1 or 2
            $numStr = $m[1][0] !== '' ? $m[1][0] : $m[2][0];
            $qty = (int)$numStr;

            // Remove the entire bracket group
            $start = $m[0][1];
            $len   = strlen($m[0][0]);
            $work  = trim(substr($work, 0, $start) . substr($work, $start + $len));
        }
        // === Case #1: "<num> <unit>" outside brackets ===
        elseif (preg_match('/(?<!\S)(\d{1,5})\s*' . $unitRegex . '(?=$|\s|[\)\]\}\.,;])/iu', $work, $m, PREG_OFFSET_CAPTURE)) {
            $qty = (int)$m[1][0];
            $start = $m[0][1];
            $len   = strlen($m[0][0]);
            $work  = trim(substr($work, 0, $start) . substr($work, $start + $len));
        }
        // === Case #2: "<unit> <num>" outside brackets ===
        elseif (preg_match('/(?<!\S)' . $unitRegex . '\s*(\d{1,5})(?=$|\s|[\)\]\}\.,;])/iu', $work, $m, PREG_OFFSET_CAPTURE)) {
            $qty = (int)$m[1][0];
            $start = $m[0][1];
            $len   = strlen($m[0][0]);
            $work  = trim(substr($work, 0, $start) . substr($work, $start + $len));
        }

        // Final whitespace cleanup
        $work = preg_replace('/\s+/u', ' ', trim($work));

        return [$qty, $work];
    }


    /**
     * List of acceptable quantity units (lowercase).
     * Can be moved to settings if needed.
     */
    protected function get_qty_units(): array
    {
        // Let's try to read it from the options, otherwise it's default.
        $opt  = (array) get_option('gsw_import', []);
        $csv  = strtolower(trim((string)($opt['qty_units'] ?? '')));
        $list = $csv !== '' ? preg_split('/[,\s]+/', $csv, -1, PREG_SPLIT_NO_EMPTY) : [];

        if (!$list) {
            $list = ['шт', 'шт.', 'pcs', 'pc', 'piece', 'pieces', 'un', 'unidad', 'unid', 'u'];
        }

        // unique and safe
        $list = array_values(array_unique(array_filter(array_map('trim', $list))));
        return $list;
    }

    protected function has_any(string $haystack, array $tokens): bool
    {
        foreach ($tokens as $t) {
            if ($t !== '' && mb_strpos($haystack, $t) !== false) return true;
        }
        return false;
    }
}
