<?php

namespace WP_Rank_Volume_Manager\Admin;

use WP_Rank_Volume_Manager\Models\History;

class Dashboard {

	public function render() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'アクセス権がありません。', 'wp-rank-volume-manager' ) );
		}

		$filters  = $this->get_filters();
		$stats    = $this->get_stats();
		$articles = $this->get_articles( $filters );
		$settings = get_option( 'wp_rv_manager_settings', [] );

		include WPRVM_DIR . 'src/Admin/Views/dashboard.php';
	}

	/**
	 * Handle CSV import from form POST.
	 * Registered on admin_post_wprvm_import_csv.
	 */
	public function handle_csv_import() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Unauthorized' );
		}
		check_admin_referer( 'wprvm_import_csv' );

		$redirect_base = admin_url( 'admin.php?page=wp-rank-volume-manager' );

		if ( empty( $_FILES['csv_file'] ) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK ) {
			wp_redirect( $redirect_base . '&import_error=' . urlencode( 'CSVファイルがアップロードされていません。' ) );
			exit;
		}

		// Validate MIME / extension
		$file_info = wp_check_filetype( $_FILES['csv_file']['name'], [ 'csv' => 'text/csv' ] );
		$ext       = strtolower( pathinfo( $_FILES['csv_file']['name'], PATHINFO_EXTENSION ) );
		if ( $ext !== 'csv' ) {
			wp_redirect( $redirect_base . '&import_error=' . urlencode( 'CSVファイルのみアップロード可能です。' ) );
			exit;
		}

		$settings = get_option( 'wp_rv_manager_settings', [] );
		$mapping  = [
			'url'     => $settings['csv_url_col']     ?? 'url',
			'keyword' => $settings['csv_keyword_col'] ?? 'keyword',
			'rank'    => $settings['csv_rank_col']    ?? 'rank',
			'volume'  => $settings['csv_volume_col']  ?? 'volume',
		];

		$importer = new CSVImporter( $_FILES['csv_file']['tmp_name'], $mapping );
		$result   = $importer->import_and_evaluate();

		if ( is_wp_error( $result ) ) {
			wp_redirect( $redirect_base . '&import_error=' . urlencode( $result->get_error_message() ) );
			exit;
		}

		// Store parse debug info in a transient so the dashboard can display it
		if ( ! empty( $result['parse_debug'] ) ) {
			set_transient( 'wprvm_parse_debug', $result['parse_debug'], 60 );
		}

		wp_redirect( add_query_arg( [
			'imported'   => '1',
			'total'      => $result['total'],
			'candidates' => $result['candidate'],
		], $redirect_base ) );
		exit;
	}

	// -----------------------------------------------------------------------
	// Private helpers
	// -----------------------------------------------------------------------

	private function get_filters() {
		return [
			'verdict'  => sanitize_text_field( $_GET['filter_verdict']  ?? '' ),
			'status'   => sanitize_text_field( $_GET['filter_status']   ?? '' ),
			's'        => sanitize_text_field( $_GET['s']               ?? '' ),
			'paged'    => max( 1, absint( $_GET['paged'] ?? 1 ) ),
			'per_page' => 30,
		];
	}

	private function get_stats() {
		global $wpdb;

		$batch_id = get_option( 'wp_rv_manager_current_batch', '' );

		$total = $batch_id
			? (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}rv_import_rows WHERE batch_id = %s AND post_id IS NOT NULL", $batch_id ) )
			: 0;

		$unpublished = (int) $wpdb->get_var(
			"SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = '_wprvm_auto_unpublished' AND meta_value = '1'"
		);

		$restored        = History::count_by_action( 'restore', 30 );
		$unpublished_30d = History::count_by_action( 'auto_unpublish', 30 );

		$candidates = $batch_id
			? (int) $wpdb->get_var(
				$wpdb->prepare(
					"SELECT COUNT(*) FROM {$wpdb->prefix}rv_import_rows ir
					 INNER JOIN {$wpdb->posts} p ON p.ID = ir.post_id
					 WHERE ir.batch_id = %s
					   AND ir.verdict  = 'candidate'
					   AND p.post_status = 'publish'",
					$batch_id
				)
			)
			: 0;

		return compact( 'total', 'unpublished', 'restored', 'candidates', 'unpublished_30d' );
	}

	private function get_articles( array $filters ) {
		global $wpdb;

		$batch_id = get_option( 'wp_rv_manager_current_batch', '' );

		if ( empty( $batch_id ) ) {
			return [
				'rows'        => [],
				'total'       => 0,
				'per_page'    => $filters['per_page'],
				'paged'       => $filters['paged'],
				'total_pages' => 0,
			];
		}

		$where = [ $wpdb->prepare( "ir.batch_id = %s", $batch_id ) ];

		if ( $filters['verdict'] ) {
			if ( $filters['verdict'] === 'auto_unpublished' ) {
				$where[] = "pm_auto.meta_value = '1'";
			} elseif ( $filters['verdict'] === 'restored' ) {
				$where[] = "pm_res.meta_value = '1'";
			} else {
				$where[] = $wpdb->prepare( "ir.verdict = %s", $filters['verdict'] );
			}
		}

		if ( $filters['status'] ) {
			$where[] = $wpdb->prepare( "p.post_status = %s", $filters['status'] );
		}

		if ( $filters['s'] ) {
			$like    = '%' . $wpdb->esc_like( $filters['s'] ) . '%';
			$where[] = $wpdb->prepare(
				"(p.post_title LIKE %s OR ir.url LIKE %s OR ir.keyword LIKE %s)",
				$like, $like, $like
			);
		}

		$where_sql = 'WHERE ' . implode( ' AND ', $where );
		$limit     = (int) $filters['per_page'];
		$offset    = ( $filters['paged'] - 1 ) * $limit;

		$base_join = "FROM {$wpdb->prefix}rv_import_rows ir
					  LEFT JOIN {$wpdb->posts} p
					       ON p.ID = ir.post_id
					  LEFT JOIN {$wpdb->postmeta} pm_auto
					       ON pm_auto.post_id = ir.post_id AND pm_auto.meta_key = '_wprvm_auto_unpublished'
					  LEFT JOIN {$wpdb->postmeta} pm_res
					       ON pm_res.post_id  = ir.post_id AND pm_res.meta_key  = '_wprvm_restored'
					  LEFT JOIN {$wpdb->postmeta} pm_at
					       ON pm_at.post_id   = ir.post_id AND pm_at.meta_key   = '_wprvm_unpublished_at'";

		$total = (int) $wpdb->get_var( "SELECT COUNT(*) $base_join $where_sql" );

		// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT ir.*,
				        p.post_title,
				        p.post_status         AS wp_status,
				        pm_auto.meta_value    AS is_auto_unpublished,
				        pm_res.meta_value     AS is_restored,
				        pm_at.meta_value      AS unpublished_at
				 $base_join
				 $where_sql
				 ORDER BY
				   CASE ir.verdict
				     WHEN 'candidate' THEN 1
				     WHEN 'kept'      THEN 2
				     WHEN 'excluded'  THEN 3
				     ELSE 4
				   END ASC,
				   ir.rank ASC
				 LIMIT %d OFFSET %d",
				$limit,
				$offset
			)
		);
		// phpcs:enable

		foreach ( $rows as $row ) {
			if ( $row->is_auto_unpublished && ! $row->is_restored ) {
				$row->display_status = 'auto_unpublished';
			} elseif ( $row->is_restored ) {
				$row->display_status = 'restored';
			} else {
				$row->display_status = $row->wp_status ?? 'unknown';
			}
		}

		return [
			'rows'        => $rows,
			'total'       => $total,
			'per_page'    => $filters['per_page'],
			'paged'       => $filters['paged'],
			'total_pages' => ceil( $total / $filters['per_page'] ),
		];
	}
}
