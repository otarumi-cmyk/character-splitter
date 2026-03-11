<?php

namespace WP_Rank_Volume_Manager\Core;

use WP_Rank_Volume_Manager\Models\History;

class UnpublishManager {

	private $settings;

	public function __construct() {
		$this->settings = get_option( 'wp_rv_manager_settings', [] );
	}

	/**
	 * Unpublish the given post IDs.
	 * Returns per-ID result array: ['success' => bool, 'message' => string]
	 */
	public function unpublish_by_ids( array $post_ids ) {
		$target_status = $this->settings['target_status'] ?? 'draft';
		$results       = [];

		foreach ( $post_ids as $post_id ) {
			$post_id = absint( $post_id );
			$post    = get_post( $post_id );

			if ( ! $post ) {
				$results[ $post_id ] = [ 'success' => false, 'message' => '記事が見つかりません。' ];
				continue;
			}

			$prev_status = $post->post_status;

			// Save original status and flags so we can restore later
			update_post_meta( $post_id, '_wprvm_prev_status',     $prev_status );
			update_post_meta( $post_id, '_wprvm_auto_unpublished', '1' );
			update_post_meta( $post_id, '_wprvm_unpublished_at',  current_time( 'mysql' ) );
			delete_post_meta( $post_id, '_wprvm_restored' );

			$updated = wp_update_post( [
				'ID'          => $post_id,
				'post_status' => $target_status,
			] );

			if ( $updated && ! is_wp_error( $updated ) ) {
				$import_row = $this->get_latest_import_row( $post_id );

				History::insert( [
					'post_id'     => $post_id,
					'action_type' => 'auto_unpublish',
					'prev_status' => $prev_status,
					'new_status'  => $target_status,
					'rank'        => $import_row ? $import_row->rank   : null,
					'volume'      => $import_row ? $import_row->volume  : null,
					'keyword'     => $import_row ? $import_row->keyword : '',
					'rule_used'   => $this->rule_description(),
					'executed_by' => get_current_user_id(),
				] );

				$results[ $post_id ] = [ 'success' => true ];
			} else {
				$results[ $post_id ] = [ 'success' => false, 'message' => 'ステータス更新に失敗しました。' ];
			}
		}

		return $results;
	}

	private function get_latest_import_row( $post_id ) {
		global $wpdb;

		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}rv_import_rows
				 WHERE post_id = %d
				 ORDER BY imported_at DESC LIMIT 1",
				$post_id
			)
		);
	}

	private function rule_description() {
		$s = $this->settings;

		return sprintf(
			'順位閾値=%d / ボリューム閾値=%d / ロジック=%s',
			(int) ( $s['rank_threshold']   ?? 20 ),
			(int) ( $s['volume_threshold'] ?? 100 ),
			$s['logic'] ?? 'AND'
		);
	}
}
