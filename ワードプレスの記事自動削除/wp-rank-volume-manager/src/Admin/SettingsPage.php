<?php

namespace WP_Rank_Volume_Manager\Admin;

class SettingsPage {

	private static function defaults() {
		return [
			'rank_threshold'      => 20,
			'volume_threshold'    => 100,
			'logic'               => 'AND',
			'target_status'       => 'draft',
			'execution_timing'    => 'manual',
			'target_post_types'   => [ 'post' ],
			'excluded_categories' => [],
			'excluded_tags'       => [],
			'excluded_post_ids'   => '',
			'protection_days'     => 30,
			'csv_url_col'         => 'URL',
			'csv_keyword_col'     => 'keyword',
			'csv_rank_col'        => 'rank',
			'csv_volume_col'      => 'volume',
		];
	}

	public function render() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'アクセス権がありません。', 'wp-rank-volume-manager' ) );
		}

		$saved   = isset( $_GET['settings-updated'] ) && $_GET['settings-updated'] === '1';
		$options = wp_parse_args( get_option( 'wp_rv_manager_settings', [] ), self::defaults() );

		// Get available post types, categories for UI
		$post_types = $this->get_available_post_types();
		$categories = get_categories( [ 'hide_empty' => false ] );
		$tags       = get_tags( [ 'hide_empty' => false ] );

		include WPRVM_DIR . 'src/Admin/Views/settings.php';
	}

	public function handle_save() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Unauthorized' );
		}
		check_admin_referer( 'wprvm_save_settings' );

		$opts = [];

		$opts['rank_threshold']   = absint( $_POST['rank_threshold']   ?? 20 );
		$opts['volume_threshold'] = absint( $_POST['volume_threshold'] ?? 100 );
		$opts['logic']            = in_array( $_POST['logic'] ?? '', [ 'AND', 'OR' ], true )
		                            ? $_POST['logic'] : 'AND';
		$opts['target_status']    = in_array( $_POST['target_status'] ?? '', [ 'draft', 'private' ], true )
		                            ? $_POST['target_status'] : 'draft';
		$opts['execution_timing'] = in_array( $_POST['execution_timing'] ?? '', [ 'manual', 'cron' ], true )
		                            ? $_POST['execution_timing'] : 'manual';

		// Post types: whitelist against available post types
		$available_types        = array_keys( $this->get_available_post_types() );
		$submitted_types        = (array) ( $_POST['target_post_types'] ?? [] );
		$opts['target_post_types'] = array_values( array_intersect( $submitted_types, $available_types ) );
		if ( empty( $opts['target_post_types'] ) ) {
			$opts['target_post_types'] = [ 'post' ];
		}

		// Excluded categories / tags (array of IDs)
		$opts['excluded_categories'] = array_filter( array_map( 'absint', (array) ( $_POST['excluded_categories'] ?? [] ) ) );
		$opts['excluded_tags']       = array_filter( array_map( 'absint', (array) ( $_POST['excluded_tags']       ?? [] ) ) );

		// Excluded post IDs: sanitize comma-separated integers
		$raw_ids                = sanitize_text_field( $_POST['excluded_post_ids'] ?? '' );
		$opts['excluded_post_ids'] = implode( ',', array_filter( array_map( 'absint', explode( ',', $raw_ids ) ) ) );

		// New article protection period
		$opts['protection_days'] = absint( $_POST['protection_days'] ?? 30 );

		// CSV column mapping
		$opts['csv_url_col']     = sanitize_text_field( $_POST['csv_url_col']     ?? 'URL' );
		$opts['csv_keyword_col'] = sanitize_text_field( $_POST['csv_keyword_col'] ?? 'キーワード' );
		$opts['csv_rank_col']    = sanitize_text_field( $_POST['csv_rank_col']    ?? '順位' );
		$opts['csv_volume_col']  = sanitize_text_field( $_POST['csv_volume_col']  ?? 'キーワードボリューム' );

		update_option( 'wp_rv_manager_settings', $opts );

		wp_redirect( admin_url( 'admin.php?page=wp-rank-volume-manager-settings&settings-updated=1' ) );
		exit;
	}

	private function get_available_post_types() {
		$types = get_post_types( [ 'public' => true ], 'objects' );
		$result = [];
		foreach ( $types as $slug => $obj ) {
			$result[ $slug ] = $obj->label;
		}
		return $result;
	}
}
