<?php

namespace WP_Rank_Volume_Manager\Admin;

use WP_Rank_Volume_Manager\Core\RuleEvaluator;

class CSVImporter {

	private $file_path;
	private $mapping;

	public function __construct( $file_path, array $mapping = [] ) {
		$this->file_path = $file_path;
		$this->mapping   = wp_parse_args( $mapping, [
			'url'     => 'URL',
			'keyword' => 'keyword',
			'rank'    => 'rank',
			'volume'  => 'volume',
		] );
	}

	/**
	 * Parse CSV, match posts, evaluate rules, persist rows to rv_import_rows.
	 *
	 * @return array|\WP_Error Summary array or WP_Error on failure.
	 */
	public function import_and_evaluate() {
		if ( ! is_readable( $this->file_path ) ) {
			return new \WP_Error( 'csv_unreadable', 'CSVファイルが読み取れません。' );
		}

		$raw_rows = $this->parse_csv();
		if ( empty( $raw_rows ) ) {
			return new \WP_Error( 'csv_empty', 'CSVが空か、ヘッダーに一致するデータがありません。' );
		}

		$settings  = get_option( 'wp_rv_manager_settings', [] );
		$evaluator = new RuleEvaluator(
			(int) ( $settings['rank_threshold']   ?? 20 ),
			(int) ( $settings['volume_threshold'] ?? 100 ),
			$settings['logic'] ?? 'AND'
		);

		$excluded_ids    = array_filter( array_map( 'absint', explode( ',', $settings['excluded_post_ids'] ?? '' ) ) );
		$excluded_cats   = array_map( 'absint', (array) ( $settings['excluded_categories'] ?? [] ) );
		$excluded_tags   = array_map( 'absint', (array) ( $settings['excluded_tags'] ?? [] ) );
		$protection_days = absint( $settings['protection_days'] ?? 30 );

		$batch_id  = substr( md5( uniqid( '', true ) ), 0, 12 );
		$timestamp = current_time( 'mysql' );

		global $wpdb;

		$counts = [
			'total'      => 0,
			'candidate'  => 0,
			'kept'       => 0,
			'excluded'   => 0,
			'no_match'   => 0,
		];

		foreach ( $raw_rows as $row ) {
			$url     = esc_url_raw( $row['url'] );
			$keyword = sanitize_text_field( $row['keyword'] );
			$rank    = (int) $row['rank'];
			$volume  = (int) $row['volume'];

			$post_id        = $this->url_to_post_id( $url );
			$verdict        = 'no_match';
			$verdict_reason = 'URLと一致する記事が見つかりません';

			if ( $post_id ) {
				$post = get_post( $post_id );

				if ( ! $post || ! in_array( $post->post_status, [ 'publish', 'draft', 'private' ], true ) ) {
					$verdict        = 'not_published';
					$verdict_reason = '公開可能な投稿ではありません';
				} elseif ( in_array( $post_id, $excluded_ids, true ) ) {
					$verdict        = 'excluded';
					$verdict_reason = '個別除外リストに含まれています';
				} elseif ( $protection_days > 0 && $this->is_recently_published( $post, $protection_days ) ) {
					$verdict        = 'excluded';
					$verdict_reason = sprintf( '公開から%d日以内のため保護対象', $protection_days );
				} else {
					$post_cats = wp_get_post_categories( $post_id );
					$post_tags = wp_get_post_tags( $post_id, [ 'fields' => 'ids' ] );

					if ( ! empty( $excluded_cats ) && array_intersect( $post_cats, $excluded_cats ) ) {
						$verdict        = 'excluded';
						$verdict_reason = '除外カテゴリーに属しています';
					} elseif ( ! empty( $excluded_tags ) && array_intersect( $post_tags, $excluded_tags ) ) {
						$verdict        = 'excluded';
						$verdict_reason = '除外タグが付いています';
					} elseif ( $evaluator->evaluate( $rank, $volume ) ) {
						$verdict        = 'candidate';
						$verdict_reason = sprintf(
							'順位 %d（閾値 %d 以上）/ ボリューム %d（閾値 %d 以下）/ ロジック %s',
							$rank,
							$evaluator->getRankThreshold(),
							$volume,
							$evaluator->getVolumeThreshold(),
							$evaluator->getLogic()
						);
					} else {
						$verdict        = 'kept';
						$verdict_reason = '閾値内のため対象外';
					}
				}
			}

			$wpdb->insert(
				$wpdb->prefix . 'rv_import_rows',
				[
					'batch_id'      => $batch_id,
					'url'           => $url,
					'post_id'       => $post_id ?: null,
					'keyword'       => $keyword,
					'rank'          => $rank,
					'volume'        => $volume,
					'verdict'       => $verdict,
					'verdict_reason' => $verdict_reason,
					'imported_at'   => $timestamp,
				],
				[ '%s', '%s', $post_id ? '%d' : null, '%s', '%d', '%d', '%s', '%s', '%s' ]
			);

			$counts['total']++;
			if ( isset( $counts[ $verdict ] ) ) {
				$counts[ $verdict ]++;
			}
		}

		update_option( 'wp_rv_manager_current_batch', $batch_id );

		return array_merge( [ 'batch_id' => $batch_id, 'parse_debug' => $this->parse_debug ], $counts );
	}

	/**
	 * Returns true if the post was published within the last $days days.
	 */
	private function is_recently_published( \WP_Post $post, int $days ): bool {
		$published_ts = strtotime( $post->post_date_gmt );
		return ( time() - $published_ts ) < ( $days * DAY_IN_SECONDS );
	}

	/**
	 * Resolve a URL to a WordPress post ID, handling trailing slashes and HTTPS/HTTP.
	 */
	private function url_to_post_id( $url ) {
		$post_id = url_to_postid( $url );

		if ( ! $post_id ) {
			// Try with/without trailing slash
			$alt = rtrim( $url, '/' ) === $url ? $url . '/' : rtrim( $url, '/' );
			$post_id = url_to_postid( $alt );
		}

		if ( ! $post_id && strpos( $url, 'https://' ) === 0 ) {
			$post_id = url_to_postid( str_replace( 'https://', 'http://', $url ) );
		} elseif ( ! $post_id && strpos( $url, 'http://' ) === 0 ) {
			$post_id = url_to_postid( str_replace( 'http://', 'https://', $url ) );
		}

		return $post_id ?: null;
	}

	/**
	 * Parse the CSV file into an array of associative rows.
	 */
	/** @var array Debug info from the last parse_csv() call. */
	private $parse_debug = [];

	private function parse_csv() {
		$this->parse_debug = [];

		$handle = fopen( $this->file_path, 'r' );
		if ( ! $handle ) {
			return [];
		}

		// Auto-detect delimiter: read first line and check tab vs comma
		$first_line = fgets( $handle );
		rewind( $handle );
		if ( $first_line === false ) {
			fclose( $handle );
			return [];
		}
		$tab_count   = substr_count( $first_line, "\t" );
		$comma_count = substr_count( $first_line, ',' );
		$delimiter   = ( $tab_count > $comma_count ) ? "\t" : ',';

		$this->parse_debug['delimiter']   = $delimiter === "\t" ? 'TAB' : 'COMMA';
		$this->parse_debug['first_line']  = substr( $first_line, 0, 200 );
		$this->parse_debug['tab_count']   = $tab_count;
		$this->parse_debug['comma_count'] = $comma_count;

		$header = fgetcsv( $handle, 0, $delimiter );
		if ( ! $header ) {
			fclose( $handle );
			return [];
		}

		// Normalize header: trim whitespace, strip BOM from first column
		foreach ( $header as $i => $h ) {
			$h = trim( $h );
			if ( $i === 0 ) {
				$h = preg_replace( '/^\xEF\xBB\xBF/', '', $h );
			}
			$header[ $i ] = $h;
		}

		$this->parse_debug['headers'] = $header;

		// Build column index map — case-insensitive matching + known alias fallback
		$header_lower = array_map( 'strtolower', $header );

		// Known aliases for each logical field (catches Japanese legacy settings)
		$aliases = [
			'url'     => [ 'url', 'URL', 'link', 'page url', 'page_url', 'ページurl', 'address' ],
			'keyword' => [ 'keyword', 'キーワード', 'query', 'search term', 'kw' ],
			'rank'    => [ 'rank', '順位', 'position', 'ranking', 'pos' ],
			'volume'  => [ 'volume', 'キーワードボリューム', '検索ボリューム', 'search volume', 'vol', 'impressions' ],
		];

		$col_map = [];
		foreach ( $this->mapping as $key => $col_name ) {
			// 1. Exact match with configured column name
			$idx = array_search( $col_name, $header, true );
			// 2. Case-insensitive match with configured column name
			if ( $idx === false ) {
				$idx = array_search( strtolower( $col_name ), $header_lower, true );
			}
			// 3. Try known aliases (handles stale Japanese settings)
			if ( $idx === false && isset( $aliases[ $key ] ) ) {
				foreach ( $aliases[ $key ] as $alias ) {
					$idx = array_search( strtolower( $alias ), $header_lower, true );
					if ( $idx !== false ) {
						break;
					}
				}
			}
			if ( $idx !== false ) {
				$col_map[ $key ] = $idx;
			}
		}

		$this->parse_debug['mapping']  = $this->mapping;
		$this->parse_debug['col_map']  = $col_map;

		$rows = [];
		while ( ( $data = fgetcsv( $handle, 0, $delimiter ) ) !== false ) {
			if ( empty( array_filter( $data ) ) ) {
				continue;
			}

			$row = [
				'url'     => isset( $col_map['url'] )     ? trim( $data[ $col_map['url'] ] )     : '',
				'keyword' => isset( $col_map['keyword'] ) ? trim( $data[ $col_map['keyword'] ] ) : '',
				'rank'    => isset( $col_map['rank'] )    ? (int) $data[ $col_map['rank'] ]       : 0,
				'volume'  => isset( $col_map['volume'] )  ? (int) $data[ $col_map['volume'] ]     : 0,
			];

			if ( empty( $row['url'] ) ) {
				continue;
			}

			$rows[] = $row;
		}

		fclose( $handle );

		return $rows;
	}
}
