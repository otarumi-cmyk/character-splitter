<?php

namespace WP_Rank_Volume_Manager;

use WP_Rank_Volume_Manager\DB\Schema;
use WP_Rank_Volume_Manager\Admin\Dashboard;
use WP_Rank_Volume_Manager\Admin\SettingsPage;
use WP_Rank_Volume_Manager\Admin\AjaxHandler;

class Plugin {

	private static $instance = null;

	private function __construct() {
		$this->init_hooks();
	}

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	// -----------------------------------------------------------------------
	// Activation / Deactivation
	// -----------------------------------------------------------------------

	public static function activate() {
		Schema::create_tables();

		if ( ! get_option( 'wp_rv_manager_settings' ) ) {
			update_option( 'wp_rv_manager_settings', [
				'rank_threshold'      => 20,
				'volume_threshold'    => 100,
				'logic'               => 'AND',
				'target_status'       => 'draft',
				'execution_timing'    => 'manual',
				'target_post_types'   => [ 'post' ],
				'excluded_categories' => [],
				'excluded_tags'       => [],
				'excluded_post_ids'   => '',
				'csv_url_col'         => 'URL',
				'csv_keyword_col'     => 'キーワード',
				'csv_rank_col'        => '順位',
				'csv_volume_col'      => 'キーワードボリューム',
			] );
		}
	}

	public static function deactivate() {
		// Future: remove scheduled cron events
	}

	// -----------------------------------------------------------------------
	// Hooks
	// -----------------------------------------------------------------------

	private function init_hooks() {
		add_action( 'admin_menu',            [ $this, 'register_admin_menu' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_assets' ] );

		// Form POST handlers
		add_action( 'admin_post_wprvm_import_csv',    [ $this, 'handle_import_csv' ] );
		add_action( 'admin_post_wprvm_save_settings', [ $this, 'handle_save_settings' ] );

		// AJAX handlers (registered once here, not per page load)
		$ajax = new AjaxHandler();
		add_action( 'wp_ajax_wprvm_unpublish',        [ $ajax, 'handle_unpublish' ] );
		add_action( 'wp_ajax_wprvm_restore',          [ $ajax, 'handle_restore' ] );
		add_action( 'wp_ajax_wprvm_get_detail',       [ $ajax, 'handle_get_detail' ] );
		add_action( 'wp_ajax_wprvm_update_whitelist', [ $ajax, 'handle_update_whitelist' ] );
	}

	// -----------------------------------------------------------------------
	// Admin menu
	// -----------------------------------------------------------------------

	public function register_admin_menu() {
		$dashboard = new Dashboard();
		$settings  = new SettingsPage();

		add_menu_page(
			__( '記事パフォーマンス管理', 'wp-rank-volume-manager' ),
			__( '記事パフォーマンス', 'wp-rank-volume-manager' ),
			'manage_options',
			'wp-rank-volume-manager',
			[ $dashboard, 'render' ],
			'dashicons-chart-line',
			6
		);

		add_submenu_page(
			'wp-rank-volume-manager',
			__( 'ダッシュボード', 'wp-rank-volume-manager' ),
			__( 'ダッシュボード', 'wp-rank-volume-manager' ),
			'manage_options',
			'wp-rank-volume-manager',
			[ $dashboard, 'render' ]
		);

		add_submenu_page(
			'wp-rank-volume-manager',
			__( '設定', 'wp-rank-volume-manager' ),
			__( '設定', 'wp-rank-volume-manager' ),
			'manage_options',
			'wp-rank-volume-manager-settings',
			[ $settings, 'render' ]
		);
	}

	// -----------------------------------------------------------------------
	// Assets
	// -----------------------------------------------------------------------

	public function enqueue_admin_assets( $hook ) {
		if ( false === strpos( $hook, 'wp-rank-volume-manager' ) ) {
			return;
		}

		wp_enqueue_style(
			'wprvm-admin',
			WPRVM_URL . 'assets/css/admin.css',
			[],
			WPRVM_VERSION
		);

		wp_enqueue_script(
			'wprvm-admin',
			WPRVM_URL . 'assets/js/admin.js',
			[ 'jquery' ],
			WPRVM_VERSION,
			true
		);

		wp_localize_script( 'wprvm-admin', 'wprvmData', [
			'ajaxurl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'wprvm_nonce' ),
			'i18n'    => [
				'confirm_unpublish' => __( '選択した記事を非公開にしますか？この操作は復元できます。', 'wp-rank-volume-manager' ),
				'confirm_restore'   => __( '選択した記事を元のステータスに戻しますか？', 'wp-rank-volume-manager' ),
				'no_selection'      => __( '1件以上の記事を選択してください。', 'wp-rank-volume-manager' ),
				'processing'        => __( '処理中...', 'wp-rank-volume-manager' ),
				'done'              => __( '完了しました。ページを再読み込みします。', 'wp-rank-volume-manager' ),
				'error'             => __( 'エラーが発生しました。', 'wp-rank-volume-manager' ),
			],
		] );
	}

	// -----------------------------------------------------------------------
	// Form POST delegates
	// -----------------------------------------------------------------------

	public function handle_import_csv() {
		( new Dashboard() )->handle_csv_import();
	}

	public function handle_save_settings() {
		( new SettingsPage() )->handle_save();
	}
}
