<?php

namespace WP_Rank_Volume_Manager\DB;

class Schema {

	const DB_VERSION = '1.0';

	public static function create_tables() {
		global $wpdb;

		$charset = $wpdb->get_charset_collate();

		$sql_import_rows = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}rv_import_rows (
			id              bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			batch_id        varchar(32)  NOT NULL DEFAULT '',
			url             text         NOT NULL,
			post_id         bigint(20)   UNSIGNED DEFAULT NULL,
			keyword         varchar(500) NOT NULL DEFAULT '',
			rank            int(11)               DEFAULT NULL,
			volume          int(11)               DEFAULT NULL,
			verdict         varchar(20)  NOT NULL DEFAULT 'pending',
			verdict_reason  varchar(500) NOT NULL DEFAULT '',
			imported_at     datetime     NOT NULL,
			PRIMARY KEY  (id),
			KEY batch_id (batch_id),
			KEY post_id  (post_id)
		) $charset;";

		$sql_history = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}rv_history (
			id          bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			post_id     bigint(20) UNSIGNED NOT NULL,
			action_type varchar(30)  NOT NULL DEFAULT '',
			prev_status varchar(20)  NOT NULL DEFAULT '',
			new_status  varchar(20)  NOT NULL DEFAULT '',
			rank        int(11)               DEFAULT NULL,
			volume      int(11)               DEFAULT NULL,
			keyword     varchar(500) NOT NULL DEFAULT '',
			rule_used   varchar(500) NOT NULL DEFAULT '',
			executed_by bigint(20)   UNSIGNED DEFAULT NULL,
			executed_at datetime     NOT NULL,
			PRIMARY KEY  (id),
			KEY post_id     (post_id),
			KEY action_type (action_type),
			KEY executed_at (executed_at)
		) $charset;";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql_import_rows );
		dbDelta( $sql_history );

		update_option( 'wp_rv_manager_db_version', self::DB_VERSION );
	}

	public static function drop_tables() {
		global $wpdb;
		$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}rv_import_rows" );
		$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}rv_history" );
	}
}
