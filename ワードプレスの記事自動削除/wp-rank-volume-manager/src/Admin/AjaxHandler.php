<?php

namespace WP_Rank_Volume_Manager\Admin;

use WP_Rank_Volume_Manager\Core\UnpublishManager;
use WP_Rank_Volume_Manager\Core\RestoreManager;
use WP_Rank_Volume_Manager\Models\History;

class AjaxHandler {

	private function verify() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( [ 'message' => 'アクセス権がありません。' ], 403 );
		}
		if ( ! check_ajax_referer( 'wprvm_nonce', 'nonce', false ) ) {
			wp_send_json_error( [ 'message' => '不正なリクエストです。' ], 403 );
		}
	}

	public function handle_unpublish() {
		$this->verify();

		$post_ids = array_filter( array_map( 'absint', (array) ( $_POST['post_ids'] ?? [] ) ) );
		if ( empty( $post_ids ) ) {
			wp_send_json_error( [ 'message' => '記事IDが指定されていません。' ] );
		}

		$manager = new UnpublishManager();
		$results = $manager->unpublish_by_ids( $post_ids );

		$success_ids = array_keys( array_filter( $results, fn( $r ) => $r['success'] ) );
		$fail_count  = count( $post_ids ) - count( $success_ids );

		wp_send_json_success( [
			'success_ids' => $success_ids,
			'fail_count'  => $fail_count,
		] );
	}

	public function handle_restore() {
		$this->verify();

		$post_ids = array_filter( array_map( 'absint', (array) ( $_POST['post_ids'] ?? [] ) ) );
		if ( empty( $post_ids ) ) {
			wp_send_json_error( [ 'message' => '記事IDが指定されていません。' ] );
		}

		$manager = new RestoreManager();
		$results = $manager->restore_by_ids( $post_ids );

		$success_ids = array_keys( array_filter( $results, fn( $r ) => $r['success'] ) );
		$fail_count  = count( $post_ids ) - count( $success_ids );

		wp_send_json_success( [
			'success_ids' => $success_ids,
			'fail_count'  => $fail_count,
		] );
	}

	public function handle_get_detail() {
		$this->verify();

		$post_id = absint( $_POST['post_id'] ?? 0 );
		if ( ! $post_id ) {
			wp_send_json_error( [ 'message' => '記事IDが指定されていません。' ] );
		}

		$post = get_post( $post_id );
		if ( ! $post ) {
			wp_send_json_error( [ 'message' => '記事が見つかりません。' ] );
		}

		$settings    = get_option( 'wp_rv_manager_settings', [] );
		$ex_ids      = array_filter( array_map( 'absint', explode( ',', $settings['excluded_post_ids'] ?? '' ) ) );
		$is_excluded = in_array( $post_id, $ex_ids, true );

		$history_rows = History::get_by_post_id( $post_id );
		$history      = array_map( function ( $h ) {
			return [
				'action_type' => $h->action_type,
				'prev_status' => $h->prev_status,
				'new_status'  => $h->new_status,
				'rank'        => $h->rank,
				'volume'      => $h->volume,
				'keyword'     => $h->keyword,
				'rule_used'   => $h->rule_used,
				'executed_at' => $h->executed_at,
			];
		}, $history_rows );

		// Latest import rows for this post (last 5 imports)
		global $wpdb;
		$import_history = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT rank, volume, keyword, imported_at, verdict, verdict_reason
				 FROM {$wpdb->prefix}rv_import_rows
				 WHERE post_id = %d
				 ORDER BY imported_at DESC LIMIT 5",
				$post_id
			)
		);

		wp_send_json_success( [
			'post_id'        => $post_id,
			'title'          => get_the_title( $post_id ),
			'url'            => get_permalink( $post_id ),
			'status'         => $post->post_status,
			'is_excluded'    => $is_excluded,
			'history'        => $history,
			'import_history' => $import_history,
		] );
	}

	public function handle_update_whitelist() {
		$this->verify();

		$post_id = absint( $_POST['post_id'] ?? 0 );
		$exclude = ! empty( $_POST['exclude'] );

		if ( ! $post_id ) {
			wp_send_json_error( [ 'message' => '記事IDが指定されていません。' ] );
		}

		$settings = get_option( 'wp_rv_manager_settings', [] );
		$excluded = array_filter( array_map( 'absint', explode( ',', $settings['excluded_post_ids'] ?? '' ) ) );

		if ( $exclude ) {
			$excluded[] = $post_id;
		} else {
			$excluded = array_diff( $excluded, [ $post_id ] );
		}

		$settings['excluded_post_ids'] = implode( ',', array_unique( $excluded ) );
		update_option( 'wp_rv_manager_settings', $settings );

		wp_send_json_success( [ 'excluded' => $exclude ] );
	}
}
