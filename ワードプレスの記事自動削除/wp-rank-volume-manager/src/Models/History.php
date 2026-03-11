<?php

namespace WP_Rank_Volume_Manager\Models;

class History {

	/**
	 * Insert a new history entry.
	 *
	 * @param array $data {
	 *   post_id, action_type, prev_status, new_status,
	 *   rank, volume, keyword, rule_used, executed_by
	 * }
	 */
	public static function insert( array $data ) {
		global $wpdb;

		$rank   = isset( $data['rank'] )   && $data['rank']   !== null ? (int) $data['rank']   : null;
		$volume = isset( $data['volume'] ) && $data['volume'] !== null ? (int) $data['volume'] : null;

		$wpdb->insert(
			$wpdb->prefix . 'rv_history',
			[
				'post_id'     => absint( $data['post_id'] ),
				'action_type' => sanitize_text_field( $data['action_type'] ?? '' ),
				'prev_status' => sanitize_text_field( $data['prev_status'] ?? '' ),
				'new_status'  => sanitize_text_field( $data['new_status']  ?? '' ),
				'rank'        => $rank,
				'volume'      => $volume,
				'keyword'     => sanitize_text_field( $data['keyword'] ?? '' ),
				'rule_used'   => sanitize_text_field( $data['rule_used'] ?? '' ),
				'executed_by' => isset( $data['executed_by'] ) ? absint( $data['executed_by'] ) : null,
				'executed_at' => current_time( 'mysql' ),
			],
			[ '%d', '%s', '%s', '%s', $rank !== null ? '%d' : null, $volume !== null ? '%d' : null, '%s', '%s', '%d', '%s' ]
		);
	}

	/**
	 * Return all history rows for a post, oldest first.
	 */
	public static function get_by_post_id( $post_id ) {
		global $wpdb;

		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}rv_history WHERE post_id = %d ORDER BY executed_at ASC",
				absint( $post_id )
			)
		);
	}

	/**
	 * Return the most recent unpublish entry for a post.
	 */
	public static function get_last_unpublish( $post_id ) {
		global $wpdb;

		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}rv_history
				 WHERE post_id = %d AND action_type IN ('auto_unpublish','manual_unpublish')
				 ORDER BY executed_at DESC LIMIT 1",
				absint( $post_id )
			)
		);
	}

	/**
	 * Count history rows by action type within the last N days.
	 */
	public static function count_by_action( $action_type, $days = 30 ) {
		global $wpdb;

		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->prefix}rv_history
				 WHERE action_type = %s
				   AND executed_at >= DATE_SUB(NOW(), INTERVAL %d DAY)",
				$action_type,
				(int) $days
			)
		);
	}
}
