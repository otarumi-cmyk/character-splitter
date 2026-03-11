<?php

namespace WP_Rank_Volume_Manager\Core;

class Logger {
    private $log_file;

    public function __construct() {
        // Use plugin base dir constant (defined in main plugin file) when available.
        $base = defined('WP_RANK_VOLUME_MANAGER_DIR') ? WP_RANK_VOLUME_MANAGER_DIR : plugin_dir_path(__FILE__) . '../../';
        $log_dir = rtrim($base, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'logs';
        if (!file_exists($log_dir)) {
            wp_mkdir_p($log_dir);
        }
        $this->log_file = $log_dir . DIRECTORY_SEPARATOR . 'plugin.log';
        if (!file_exists($this->log_file)) {
            file_put_contents($this->log_file, '');
        }
    }

    public function log($message) {
        $timestamp = date('Y-m-d H:i:s');
        $formatted_message = "[$timestamp] $message" . PHP_EOL;
        file_put_contents($this->log_file, $formatted_message, FILE_APPEND);
    }

    public function get_logs() {
        return file_get_contents($this->log_file);
    }

    public function clear_logs() {
        file_put_contents($this->log_file, '');
    }
}