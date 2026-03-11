<?php
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

global $wpdb;

$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}rv_import_rows" );
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}rv_history" );

delete_option( 'wp_rv_manager_settings' );
delete_option( 'wp_rv_manager_db_version' );
delete_option( 'wp_rv_manager_current_batch' );
