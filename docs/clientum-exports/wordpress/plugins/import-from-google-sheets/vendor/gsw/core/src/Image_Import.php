<?php
namespace GSW\Core;

use GSW\Core\Logs;
use function wp_tempnam;
use function wp_check_filetype;

if (!defined('ABSPATH')) exit;

/**
 * Google Drive image importer (no resize, format + size filters):
 * - Folder can be a Drive folder URL or raw folder id.
 * - Requires Service Account JSON in Settings (share the folder with SA email or make folder public).
 * - Skips files larger than "max_file_mb" (0 = no limit).
 * - Skips files with extensions not in "allowed_ext".
 * - Attaches images to product: first -> featured, rest -> gallery.
 */
class Image_Import
{
    /**
     * Import images into a product from a Google Drive folder.
     *
     * @param int    $product_id
     * @param string $folderSpec Folder URL or ID (must be accessible to the Service Account or public)
     * @param int    $limit      Max number of images to import (1..20)
     * @param int    $_deprecated_maxLongEdge Deprecated (ignored)
     * @param string $rowId      Import row id for logging
     * @return array{added:int[], errors:string[]}
     */
    public static function import_for_product(int $product_id, string $folderSpec, int $limit = 5, int $_deprecated_maxLongEdge = 0, string $rowId = ''): array
    {
        $result = ['added' => [], 'errors' => []];

        if ($product_id <= 0) return $result;
        $limit = max(1, min(20, (int)$limit));

        $opt         = (array) get_option('gsw_google', []);
        $max_file_mb = isset($opt['max_file_mb']) ? (float)$opt['max_file_mb'] : 10.0; // 0 = unlimited
        $max_bytes   = $max_file_mb > 0 ? (int) round($max_file_mb * 1024 * 1024) : 0;
        $allowed_ext = self::get_allowed_exts($opt['allowed_ext'] ?? 'png,jpg,jpeg,webp');
        $allowed_mime= self::exts_to_mimes($allowed_ext);

        // Drive client
        $service = self::build_drive_service($rowId);
        if (!$service) {
            $result['errors'][] = 'Drive client not initialized';
            return $result;
        }

        // Resolve folder id
        $folderId = self::parse_folder_id($folderSpec);
        if ($folderId === '') {
            Logs::write($rowId, 'error', 'Images: failed to parse folder id', ['folder' => $folderSpec]);
            $result['errors'][] = 'Bad folder id';
            return $result;
        }

        Logs::write($rowId, 'info', 'Images: listing folder', [
            'folder'       => $folderId,
            'limit'        => $limit,
            'max_file_mb'  => $max_file_mb,
            'allowed_ext'  => implode(',', $allowed_ext),
        ]);

        try {
            $files = self::list_images($service, $folderId, $limit, $allowed_mime, $max_bytes);
        } catch (\Throwable $e) {
            Logs::write($rowId, 'error', 'Images: list failed: ' . $e->getMessage(), ['folder' => $folderId]);
            $result['errors'][] = 'List failed';
            return $result;
        }

        if (!$files) {
            Logs::write($rowId, 'warn', 'Images: no images match filters', ['folder' => $folderId]);
            return $result;
        }

        require_once ABSPATH . 'wp-admin/includes/image.php';

        $idx = 1;
        foreach ($files as $f) {
            $name = $f['name'];
            $id   = $f['id'];
            $mime = $f['mime'];
            $size = (int) $f['size'];

            try {
                // Double-check size from metadata (safety net)
                if ($max_bytes > 0 && $size > 0 && $size > $max_bytes) {
                    Logs::write($rowId, 'warn', 'Images: skip by size (meta)', ['file' => $id, 'size' => $size]);
                    continue;
                }

                $tmp = self::download_to_tmp($service, $id, $name, $mime);
                if (!$tmp) {
                    Logs::write($rowId, 'error', 'Images: download failed', ['file' => $id]);
                    $result['errors'][] = "Download failed: $id";
                    continue;
                }

                // Double-check actual downloaded file size
                if ($max_bytes > 0) {
                    $fs = @filesize($tmp);
                    if ($fs !== false && $fs > $max_bytes) {
                        @unlink($tmp);
                        Logs::write($rowId, 'warn', 'Images: skip by size (file)', ['file' => $id, 'size' => $fs]);
                        continue;
                    }
                }

                // Check extension after download (in case of non-standard naming)
                $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                if (!in_array($ext, $allowed_ext, true)) {
                    @unlink($tmp);
                    Logs::write($rowId, 'warn', 'Images: skip by extension', ['file' => $id, 'ext' => $ext]);
                    continue;
                }

                // Upload into WP uploads and create attachment
                $attach_id = self::attach_file($tmp, $name, $product_id, $mime, $idx);
                @unlink($tmp);

                if ($attach_id) {
                    $result['added'][] = $attach_id;
                    $idx++;
                } else {
                    $result['errors'][] = "Attach failed: $name";
                    Logs::write($rowId, 'error', 'Images: attach failed', ['name' => $name]);
                }
            } catch (\Throwable $e) {
                $result['errors'][] = $e->getMessage();
                Logs::write($rowId, 'error', 'Images: error ' . $e->getMessage(), ['file' => $id, 'name' => $name]);
            }
        }

        // Set featured image and gallery
        if ($result['added']) {
            $first = (int) array_shift($result['added']);
            set_post_thumbnail($product_id, $first);

            $gallery = array_map('intval', $result['added']);
            $p = wc_get_product($product_id);
            if ($p) {
                $p->set_gallery_image_ids($gallery);
                $p->save();
            }
            array_unshift($gallery, $first);
            $result['added'] = $gallery;
            Logs::write($rowId, 'info', 'Images: featured & gallery set', ['featured' => $first, 'gallery' => implode(',', $gallery)]);
        }

        return $result;
    }

    /**
     * Preview how many images will be imported for a folder (without downloading).
     * Returns number of files that match filters and would be processed (respecting $limit).
     */
    public static function count_for_folder(string $folderSpec, int $limit = 5, string $rowId = ''): int
    {
        $limit = max(1, min(20, (int) $limit));

        $opt         = (array) get_option('gsw_google', []);
        $max_file_mb = isset($opt['max_file_mb']) ? (float) $opt['max_file_mb'] : 10.0; // 0 = unlimited
        $max_bytes   = $max_file_mb > 0 ? (int) round($max_file_mb * 1024 * 1024) : 0;

        $allowed_ext  = self::get_allowed_exts($opt['allowed_ext'] ?? 'png,jpg,jpeg,webp');
        $allowed_mime = self::exts_to_mimes($allowed_ext);

        // Drive client
        $service = self::build_drive_service($rowId);
        if (!$service) {
            Logs::write($rowId, 'error', 'Images preview: Drive client not initialized');
            return 0;
        }

        // Resolve folder id
        $folderId = self::parse_folder_id($folderSpec);
        if ($folderId === '') {
            Logs::write($rowId, 'error', 'Images preview: failed to parse folder id', ['folder' => $folderSpec]);
            return 0;
        }

        Logs::write($rowId, 'info', 'Images preview: counting folder', [
            'folder'       => $folderId,
            'limit'        => $limit,
            'max_file_mb'  => $max_file_mb,
            'allowed_ext'  => implode(',', $allowed_ext),
        ]);

        try {
            // list_images already applies mime/size/limit filtering (as in import)
            $files = self::list_images($service, $folderId, $limit, $allowed_mime, $max_bytes);
        } catch (\Throwable $e) {
            Logs::write($rowId, 'error', 'Images preview: list failed: ' . $e->getMessage(), ['folder' => $folderId]);
            return 0;
        }

        if (!$files) {
            return 0;
        }

        // Safety: also verify ext from name (same as import does after download).
        $count = 0;
        foreach ($files as $f) {
            $name = (string) ($f['name'] ?? '');
            $ext  = strtolower(pathinfo($name, PATHINFO_EXTENSION));

            if ($ext === '' || !in_array($ext, $allowed_ext, true)) {
                continue;
            }

            $count++;
        }

        return $count;
    }

     /** -------- Drive helpers -------- */

    /**
     * Public method (used by AJAX validation too).
     */
    public static function build_drive_service(string $rowId = '')
    {
        if (!class_exists(\Google\Client::class) && !class_exists('Google_Client')) {
            Logs::write($rowId, 'error', 'Images: google/apiclient library missing (vendor)');
            return null;
        }

        $opt  = (array) get_option('gsw_google', []);
        $json = (string)($opt['service_json'] ?? '');

        if ($json === '') {
            Logs::write($rowId, 'error', 'Images: Service Account JSON not configured');
            return null;
        }

        $conf = self::normalize_json($json);
        if ($conf === '') {
            Logs::write($rowId, 'error', 'Images: invalid Service Account JSON');
            return null;
        }

        $cfgArr = json_decode($conf, true);

        $client = class_exists(\Google\Client::class) ? new \Google\Client() : new \Google_Client();
        $client->setAuthConfig($cfgArr);
        $client->setScopes(['https://www.googleapis.com/auth/drive.readonly']);
        $client->setSubject(null);

        $serviceClass = class_exists(\Google\Service\Drive::class) ? \Google\Service\Drive::class : \Google_Service_Drive::class;
        return new $serviceClass($client);
    }

    protected static function normalize_json(string $raw): string
    {
        $raw = trim($raw);
        if ($raw === '') return '';
        // File path?
        if (strpos($raw, '{') === false && strpos($raw, "\n") === false && is_file($raw)) {
            $raw = (string) @file_get_contents($raw);
        }
        // base64?
        if (strpos($raw, '{') === false) {
            $decoded = base64_decode($raw, true);
            if ($decoded) $raw = $decoded;
        }
        $arr = json_decode($raw, true);
        return is_array($arr) ? json_encode($arr) : '';
    }

    protected static function parse_folder_id(string $spec): string
    {
        $spec = trim($spec);
        if ($spec === '') return '';
        if (preg_match('~drive\.google\.com/drive/folders/([^/?#]+)~i', $spec, $m)) return $m[1];
        if (preg_match('~drive\.google\.com/.*[?&]id=([^&#]+)~i', $spec, $m))   return $m[1];
        if (preg_match('~^[A-Za-z0-9_-]{10,}$~', $spec))                        return $spec;
        return '';
    }

    /**
     * List files and filter by MIME and size until $limit is reached.
     */
    protected static function list_images($service, string $folderId, int $limit, array $allowed_mimes, int $max_bytes): array
    {
        $mimeOr = [];
        foreach ($allowed_mimes as $m) {
            $mimeOr[] = "mimeType = '{$m}'";
        }
        $mimeClause = $mimeOr ? '(' . implode(' or ', $mimeOr) . ')' : "mimeType contains 'image/'";

        $q = [
            "'{$folderId}' in parents",
            'trashed = false',
            $mimeClause,
        ];

        $fields = 'files(id,name,mimeType,size,imageMediaMetadata(width,height),createdTime,modifiedTime),nextPageToken';

        $params = [
            'q'                         => implode(' and ', $q),
            'fields'                    => $fields,
            'pageSize'                  => 100,                
            'orderBy'                   => 'createdTime',      
            'supportsAllDrives'         => true,
            'includeItemsFromAllDrives' => true,
        ];

        $selected  = [];
        $pageToken = null;

        do {
            if ($pageToken) $params['pageToken'] = $pageToken;

            try {
                $resp = $service->files->listFiles($params);
            } catch (\Google\Service\Exception $e) {
                if ($e->getCode() === 400) {
                    unset($params['fields']);
                    $resp = $service->files->listFiles($params);
                } else {
                    throw $e;
                }
            }

            $arr = $resp->getFiles();

            if (is_array($arr)) {
                foreach ($arr as $f) {
                    $mime = $f->getMimeType();
                    $id   = $f->getId();
                    $name = $f->getName();
                    $size = (int) $f->getSize();

                    if ($allowed_mimes && !in_array($mime, $allowed_mimes, true)) {
                        continue;
                    }
                    // Size limit (0 = no limit)
                    if ($max_bytes > 0 && $size > 0 && $size > $max_bytes) {
                        continue;
                    }

                    $selected[] = [
                        'id'   => $id,
                        'name' => $name,
                        'mime' => $mime,
                        'size' => $size,
                    ];

                    if (count($selected) >= $limit) break 2;
                }
            }

            $pageToken = $resp->getNextPageToken();
        } while ($pageToken && count($selected) < $limit);

        return $selected;
    }


    protected static function download_to_tmp($service, string $fileId, string $name, string $mime): string
    {
        $response = $service->files->get($fileId, ['alt' => 'media']);
        $content  = method_exists($response, 'getBody') ? $response->getBody()->getContents() : (string)$response;
        if ($content === '') return '';

        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if ($ext === '') {
            $ext = self::mime_to_ext($mime) ?: 'jpg';
        }
        if (!function_exists('wp_tempnam')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        $tmp = wp_tempnam($name . '.' . $ext);
        if (!$tmp) return '';
        file_put_contents($tmp, $content);
        return $tmp;
    }

    protected static function attach_file(string $tmpPath, string $name, int $post_id, string $mime = '', int $index = 1): int
    {
        // Read temp file and save into uploads (creates attachment record after that)
        $data = @file_get_contents($tmpPath);
        if ($data === false) return 0;

        $upload = wp_upload_bits($name, null, $data);
        if (!empty($upload['error'])) return 0;

        $file        = $upload['file'];
        if (!function_exists('wp_check_filetype')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        $wp_filetype = wp_check_filetype($file, null);
        $mime        = $mime ?: ($wp_filetype['type'] ?? 'image/jpeg');

        // --- Derive texts from product ---
        $product_title          = '';
        $attachment_caption     = '';
        $attachment_description = '';
        $sku                    = '';

        if (function_exists('wc_get_product')) {
            $product = wc_get_product($post_id);
            if ($product) {
                $product_title = wp_strip_all_tags($product->get_name());
                $short         = $product->get_short_description();   // HTML allowed
                $full          = $product->get_description();         // HTML allowed
                $sku           = (string) $product->get_sku();

                // Caption = product title
                $attachment_caption = $product_title;

                // Description = short description if present, otherwise full description
                $desc_src = $short ?: $full;
                if ($desc_src) {
                    // Keep safe HTML for attachment description
                    $attachment_description = wp_kses_post($desc_src);
                }
            }
        }

        if (!$product_title) {
            // Fallback to the product post title or filename
            $product_title = wp_strip_all_tags(get_the_title($post_id));
            if (!$product_title) {
                $product_title = sanitize_file_name(pathinfo($name, PATHINFO_FILENAME));
            }
        }

        $baseTitle = $product_title;
        if ($sku !== '') {
            $baseTitle .= ' [' . $sku . ']';
        }
        // Unique title/caption with index
        $titleWithIndex   = $baseTitle . ' — #' . max(1, (int)$index);
        $captionWithIndex = $titleWithIndex;

        // ALT text: no index, but include SKU if present
        $altText = $product_title . ($sku !== '' ? ' [' . $sku . ']' : '');

        $attachment = [
            'post_mime_type' => $mime,
            'post_title'     => $titleWithIndex,            // attachment title
            'post_excerpt'   => $captionWithIndex,          // caption
            'post_content'   => $attachment_description,    // description
            'post_status'    => 'inherit',
        ];

        $attach_id = wp_insert_attachment($attachment, $file, $post_id);
        if (!$attach_id) return 0;

        // Alt text meta
        if ($altText !== '') {
            update_post_meta($attach_id, '_wp_attachment_image_alt', $altText);
        }

        // Generate and save attachment metadata (sizes, etc.)
        $meta = wp_generate_attachment_metadata($attach_id, $file);
        wp_update_attachment_metadata($attach_id, $meta);

        return (int) $attach_id;
    }


    /** -------- Helpers -------- */

    protected static function get_allowed_exts(string $extCsv): array
    {
        $extCsv = strtolower($extCsv);
        $parts  = array_filter(array_map('trim', preg_split('/[,\s]+/', $extCsv)));
        $parts  = array_values(array_unique(array_filter($parts, fn($e) => preg_match('/^[a-z0-9]+$/', $e))));
        if (in_array('jpg', $parts, true) && !in_array('jpeg', $parts, true)) $parts[] = 'jpeg';
        if (!$parts) $parts = ['png', 'jpg', 'jpeg', 'webp'];
        return $parts;
    }

    protected static function exts_to_mimes(array $exts): array
    {
        $map = [
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'webp' => 'image/webp',
            'gif'  => 'image/gif',
            'bmp'  => 'image/bmp',
            'tiff' => 'image/tiff',
            'heic' => 'image/heic',
            'svg'  => 'image/svg+xml', 
        ];
        $m = [];
        foreach ($exts as $e) {
            if (isset($map[$e])) $m[] = $map[$e];
        }
        return array_values(array_unique($m));
    }

    protected static function mime_to_ext(string $mime): ?string
    {
        static $rev = [
            'image/jpeg'    => 'jpg',
            'image/png'     => 'png',
            'image/webp'    => 'webp',
            'image/gif'     => 'gif',
            'image/bmp'     => 'bmp',
            'image/tiff'    => 'tiff',
            'image/heic'    => 'heic',
            'image/svg+xml' => 'svg',
        ];
        return $rev[$mime] ?? null;
    }
}
