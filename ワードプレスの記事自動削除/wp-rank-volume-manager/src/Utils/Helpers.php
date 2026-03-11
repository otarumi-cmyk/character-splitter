<?php

class Helpers {
    /**
     * Sanitize a string for safe output.
     *
     * @param string $string
     * @return string
     */
    public static function sanitizeString($string) {
        return htmlspecialchars(strip_tags($string), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Format a date for display.
     *
     * @param string $date
     * @return string
     */
    public static function formatDate($date) {
        return date_i18n(get_option('date_format'), strtotime($date));
    }

    /**
     * Generate a URL for a specific post.
     *
     * @param int $postId
     * @return string
     */
    public static function getPostUrl($postId) {
        return get_permalink($postId);
    }

    /**
     * Log a message to the debug log.
     *
     * @param string $message
     */
    public static function log($message) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log($message);
        }
    }

    /**
     * Check if a value is in an array.
     *
     * @param mixed $value
     * @param array $array
     * @return bool
     */
    public static function inArray($value, $array) {
        return in_array($value, $array, true);
    }
}