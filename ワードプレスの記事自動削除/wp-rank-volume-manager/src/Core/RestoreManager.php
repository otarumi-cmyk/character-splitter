<?php

namespace WP_Rank_Volume_Manager\Core;

use WP_Rank_Volume_Manager\Models\History;

class RestoreManager {

	/**
	 * Restore the given post IDs to their original pre-unpublish status.
	 * Returns per-ID result array: ['success' => bool, 'message' => string]
	 */
	public function restore_by_ids( array $post_ids ) {
		$results = [];

		foreach ( $post_ids as $post_id ) {
			$post_id = absint( $post_id );
			$post    = get_post( $post_id );

			if ( ! $post ) {
				$results[ $post_id ] = [ 'success' => false, 'message' => '記事が見つかりません。' ];
				continue;
			}

			$prev_status     = $post->post_status;
			$original_status = get_post_meta( $post_id, '_wprvm_prev_status', true );

			if ( empty( $original_status ) ) {
				$original_status = 'publish'; // safe fallback
			}

			$updated = wp_update_post( [
				'ID'          => $post_id,
				'post_status' => $original_status,
			] );

			if ( $updated && ! is_wp_error( $updated ) ) {
				delete_post_meta( $post_id, '_wprvm_auto_unpublished' );
				delete_post_meta( $post_id, '_wprvm_unpublished_at' );
				update_post_meta( $post_id, '_wprvm_restored', '1' );

				History::insert( [
					'post_id'     => $post_id,
					'action_type' => 'restore',
					'prev_status' => $prev_status,
					'new_status'  => $original_status,
					'rank'        => null,
					'volume'      => null,
					'keyword'     => '',
					'rule_used'   => 'restore',
					'executed_by' => get_current_user_id(),
				] );

				$results[ $post_id ] = [ 'success' => true ];
			} else {
				$results[ $post_id ] = [ 'success' => false, 'message' => 'ステータス更新に失敗しました。' ];
			}
		}

		return $results;
	}
}
