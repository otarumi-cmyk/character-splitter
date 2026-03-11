<?php
/**
 * Plugin Name: WP Rank Volume Manager
 * Description: 検索順位とキーワードボリュームをもとに記事を自動非公開・ワンクリック復元できるWordPressプラグイン
 * Version: 1.0.0
 * Author: Your Name
 * License: GPL-2.0-or-later
 * Text Domain: wp-rank-volume-manager
 * Domain Path: /languages
 */

defined( 'ABSPATH' ) || exit;

define( 'WPRVM_VERSION',  '1.0.0' );
define( 'WPRVM_DIR',      plugin_dir_path( __FILE__ ) );
define( 'WPRVM_URL',      plugin_dir_url( __FILE__ ) );
define( 'WPRVM_BASENAME', plugin_basename( __FILE__ ) );

// PSR-4 style autoloader for WP_Rank_Volume_Manager namespace
spl_autoload_register( function ( $class ) {
	$prefix = 'WP_Rank_Volume_Manager\\';
	if ( strncmp( $prefix, $class, strlen( $prefix ) ) !== 0 ) {
		return;
	}
	$relative  = substr( $class, strlen( $prefix ) );
	$file_path = WPRVM_DIR . 'src/' . str_replace( '\\', DIRECTORY_SEPARATOR, $relative ) . '.php';
	if ( is_readable( $file_path ) ) {
		require_once $file_path;
	}
} );

register_activation_hook(   __FILE__, [ 'WP_Rank_Volume_Manager\\Plugin', 'activate' ] );
register_deactivation_hook( __FILE__, [ 'WP_Rank_Volume_Manager\\Plugin', 'deactivate' ] );

add_action( 'plugins_loaded', [ 'WP_Rank_Volume_Manager\\Plugin', 'get_instance' ] );
