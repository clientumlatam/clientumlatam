<?php
namespace GSW\Core;

defined('ABSPATH') || exit;

final class Assets
{
    public static function url(string $rel): string
    {
        return plugins_url('assets/' . ltrim($rel, '/'), DITSGSW_PLUGIN_FILE);
    }

    public static function path(string $rel): string
    {
        return plugin_dir_path(DITSGSW_PLUGIN_FILE) . 'assets/' . ltrim($rel, '/');
    }

    public static function ver(string $rel): string
    {
        $p = self::path($rel);
        return is_file($p) ? (string) filemtime($p) : '1.0.6';
    }
}
