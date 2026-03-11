<?php
/**
 * Dashboard view.
 * Available variables: $stats, $articles, $filters, $settings
 */
defined( 'ABSPATH' ) || exit;

// Verdict label / badge helper
function wprvm_verdict_badge( $verdict, $reason = '' ) {
	$labels = [
		'candidate'     => [ '非公開候補', 'wprvm-badge--danger' ],
		'kept'          => [ '閾値内（維持）', 'wprvm-badge--ok' ],
		'excluded'      => [ '対象外', 'wprvm-badge--neutral' ],
		'no_match'      => [ 'URL不一致', 'wprvm-badge--warn' ],
		'not_published' => [ '非公開記事', 'wprvm-badge--neutral' ],
	];
	[ $label, $cls ] = $labels[ $verdict ] ?? [ $verdict, 'wprvm-badge--neutral' ];
	$tip = $reason ? ' title="' . esc_attr( $reason ) . '"' : '';
	return '<span class="wprvm-badge ' . esc_attr( $cls ) . '"' . $tip . '>' . esc_html( $label ) . '</span>';
}

function wprvm_status_badge( $status ) {
	$map = [
		'auto_unpublished' => [ '自動非公開', 'wprvm-badge--danger' ],
		'restored'         => [ '復元済み',   'wprvm-badge--warn' ],
		'publish'          => [ '公開中',     'wprvm-badge--ok' ],
		'draft'            => [ '下書き',     'wprvm-badge--neutral' ],
		'private'          => [ '非公開',     'wprvm-badge--neutral' ],
	];
	[ $label, $cls ] = $map[ $status ] ?? [ $status, 'wprvm-badge--neutral' ];
	return '<span class="wprvm-badge ' . esc_attr( $cls ) . '">' . esc_html( $label ) . '</span>';
}

$current_url = admin_url( 'admin.php?page=wp-rank-volume-manager' );
?>

<div class="wrap wprvm-wrap">
	<h1 class="wp-heading-inline"><?php esc_html_e( '記事パフォーマンス管理', 'wp-rank-volume-manager' ); ?></h1>
	<hr class="wp-header-end">

	<?php if ( ! empty( $_GET['imported'] ) ) : ?>
		<div class="notice notice-success is-dismissible">
			<p>
				<?php
				printf(
					esc_html__( 'CSVインポート完了。%d 件を取り込み、うち %d 件が非公開候補です。', 'wp-rank-volume-manager' ),
					(int) ( $_GET['total']      ?? 0 ),
					(int) ( $_GET['candidates'] ?? 0 )
				);
				?>
			</p>
			<?php
			$parse_debug = get_transient( 'wprvm_parse_debug' );
			delete_transient( 'wprvm_parse_debug' );
			if ( $parse_debug ) :
			?>
			<details style="margin-top:8px;font-size:12px;">
				<summary style="cursor:pointer;font-weight:600;">🔍 CSV解析デバッグ情報（問題調査用）</summary>
				<table style="margin-top:6px;border-collapse:collapse;">
					<tr><th style="text-align:left;padding:2px 8px 2px 0;">区切り文字</th><td><?php echo esc_html( $parse_debug['delimiter'] ); ?> (タブ数:<?php echo (int)($parse_debug['tab_count']??0); ?> / カンマ数:<?php echo (int)($parse_debug['comma_count']??0); ?>)</td></tr>
					<tr><th style="text-align:left;padding:2px 8px 2px 0;">検出ヘッダー</th><td><?php echo esc_html( implode( ' | ', (array)($parse_debug['headers']??[]) ) ); ?></td></tr>
					<tr><th style="text-align:left;padding:2px 8px 2px 0;">設定マッピング</th><td><?php foreach ( (array)($parse_debug['mapping']??[]) as $k => $v ) echo esc_html("$k→$v "); ?></td></tr>
					<tr><th style="text-align:left;padding:2px 8px 2px 0;">列インデックス</th><td><?php foreach ( (array)($parse_debug['col_map']??[]) as $k => $idx ) echo esc_html("$k=$idx "); if(empty($parse_debug['col_map'])) echo '<strong style="color:red">マッピング失敗！</strong>'; ?></td></tr>
					<tr><th style="text-align:left;padding:2px 8px 2px 0;">先頭行(raw)</th><td style="word-break:break-all;"><?php echo esc_html( substr($parse_debug['first_line']??'', 0, 300) ); ?></td></tr>
				</table>
			</details>
			<?php endif; ?>
		</div>
	<?php endif; ?>

	<?php if ( ! empty( $_GET['import_error'] ) ) : ?>
		<div class="notice notice-error is-dismissible">
			<p><?php echo esc_html( urldecode( $_GET['import_error'] ) ); ?></p>
		</div>
	<?php endif; ?>

	<!-- ===================== CSV IMPORT ===================== -->
	<div class="wprvm-card wprvm-import-card">
		<h2><?php esc_html_e( 'CSVインポート', 'wp-rank-volume-manager' ); ?></h2>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" enctype="multipart/form-data">
			<input type="hidden" name="action" value="wprvm_import_csv">
			<?php wp_nonce_field( 'wprvm_import_csv' ); ?>
			<div class="wprvm-import-row">
				<input type="file" name="csv_file" id="wprvm-csv-file" accept=".csv" required>
				<label for="wprvm-csv-file" class="wprvm-file-label">
					<span class="dashicons dashicons-upload"></span>
					<span id="wprvm-filename"><?php esc_html_e( 'CSVファイルを選択', 'wp-rank-volume-manager' ); ?></span>
				</label>
				<?php submit_button( __( 'インポートして評価', 'wp-rank-volume-manager' ), 'primary', 'submit', false ); ?>
			</div>
			<p class="description">
				<?php
				printf(
					esc_html__( '期待するカラム名: "%s"（URL）/ "%s"（キーワード）/ "%s"（順位）/ "%s"（ボリューム）。設定画面で変更可能。', 'wp-rank-volume-manager' ),
					esc_html( $settings['csv_url_col']     ?? 'URL' ),
					esc_html( $settings['csv_keyword_col'] ?? 'キーワード' ),
					esc_html( $settings['csv_rank_col']    ?? '順位' ),
					esc_html( $settings['csv_volume_col']  ?? 'キーワードボリューム' )
				);
				?>
			</p>
		</form>
	</div>

	<!-- ===================== SUMMARY CARDS ===================== -->
	<div class="wprvm-stats-row">
		<div class="wprvm-stat-card">
			<div class="wprvm-stat-value"><?php echo esc_html( $stats['total'] ); ?></div>
			<div class="wprvm-stat-label"><?php esc_html_e( '対象記事総数', 'wp-rank-volume-manager' ); ?></div>
		</div>
		<div class="wprvm-stat-card wprvm-stat-card--danger">
			<div class="wprvm-stat-value"><?php echo esc_html( $stats['candidates'] ); ?></div>
			<div class="wprvm-stat-label"><?php esc_html_e( '非公開候補', 'wp-rank-volume-manager' ); ?></div>
		</div>
		<div class="wprvm-stat-card wprvm-stat-card--warn">
			<div class="wprvm-stat-value"><?php echo esc_html( $stats['unpublished'] ); ?></div>
			<div class="wprvm-stat-label"><?php esc_html_e( '自動非公開中', 'wp-rank-volume-manager' ); ?></div>
		</div>
		<div class="wprvm-stat-card wprvm-stat-card--ok">
			<div class="wprvm-stat-value"><?php echo esc_html( $stats['restored'] ); ?></div>
			<div class="wprvm-stat-label"><?php esc_html_e( '復元済み（30日）', 'wp-rank-volume-manager' ); ?></div>
		</div>
	</div>

	<?php if ( empty( $articles['rows'] ) && empty( get_option( 'wp_rv_manager_current_batch' ) ) ) : ?>
		<div class="wprvm-empty-state">
			<span class="dashicons dashicons-upload" style="font-size:48px;height:48px;width:48px;color:#c3c4c7;"></span>
			<p><?php esc_html_e( 'まだデータがありません。上のフォームからCSVをインポートしてください。', 'wp-rank-volume-manager' ); ?></p>
		</div>
	<?php else : ?>

		<!-- ===================== FILTERS ===================== -->
		<form method="get" id="wprvm-filter-form" class="wprvm-filter-bar">
			<input type="hidden" name="page" value="wp-rank-volume-manager">
			<select name="filter_verdict" onchange="this.form.submit()">
				<option value=""><?php esc_html_e( '判定：すべて', 'wp-rank-volume-manager' ); ?></option>
				<option value="candidate"     <?php selected( $filters['verdict'], 'candidate' ); ?>><?php esc_html_e( '非公開候補', 'wp-rank-volume-manager' ); ?></option>
				<option value="kept"          <?php selected( $filters['verdict'], 'kept' ); ?>><?php esc_html_e( '閾値内', 'wp-rank-volume-manager' ); ?></option>
				<option value="excluded"      <?php selected( $filters['verdict'], 'excluded' ); ?>><?php esc_html_e( '対象外', 'wp-rank-volume-manager' ); ?></option>
				<option value="auto_unpublished" <?php selected( $filters['verdict'], 'auto_unpublished' ); ?>><?php esc_html_e( '自動非公開中', 'wp-rank-volume-manager' ); ?></option>
				<option value="restored"      <?php selected( $filters['verdict'], 'restored' ); ?>><?php esc_html_e( '復元済み', 'wp-rank-volume-manager' ); ?></option>
				<option value="no_match"      <?php selected( $filters['verdict'], 'no_match' ); ?>><?php esc_html_e( 'URL不一致', 'wp-rank-volume-manager' ); ?></option>
			</select>

			<select name="filter_status" onchange="this.form.submit()">
				<option value=""><?php esc_html_e( 'ステータス：すべて', 'wp-rank-volume-manager' ); ?></option>
				<option value="publish" <?php selected( $filters['status'], 'publish' ); ?>><?php esc_html_e( '公開中', 'wp-rank-volume-manager' ); ?></option>
				<option value="draft"   <?php selected( $filters['status'], 'draft' ); ?>><?php esc_html_e( '下書き', 'wp-rank-volume-manager' ); ?></option>
				<option value="private" <?php selected( $filters['status'], 'private' ); ?>><?php esc_html_e( '非公開', 'wp-rank-volume-manager' ); ?></option>
			</select>

			<input type="search" name="s" value="<?php echo esc_attr( $filters['s'] ); ?>"
			       placeholder="<?php esc_attr_e( 'タイトル / URL / キーワードで検索', 'wp-rank-volume-manager' ); ?>">
			<button type="submit" class="button"><?php esc_html_e( '検索', 'wp-rank-volume-manager' ); ?></button>
			<?php if ( $filters['verdict'] || $filters['status'] || $filters['s'] ) : ?>
				<a href="<?php echo esc_url( $current_url ); ?>" class="button"><?php esc_html_e( 'リセット', 'wp-rank-volume-manager' ); ?></a>
			<?php endif; ?>
		</form>

		<!-- ===================== BULK ACTIONS ===================== -->
		<div class="wprvm-bulk-bar">
			<label>
				<input type="checkbox" id="wprvm-select-all">
				<?php esc_html_e( 'すべて選択', 'wp-rank-volume-manager' ); ?>
			</label>
			<button id="wprvm-bulk-unpublish" class="button button-primary">
				<span class="dashicons dashicons-hidden"></span>
				<?php esc_html_e( '選択した記事を非公開にする', 'wp-rank-volume-manager' ); ?>
			</button>
			<button id="wprvm-bulk-restore" class="button">
				<span class="dashicons dashicons-backup"></span>
				<?php esc_html_e( '選択した記事を復元する', 'wp-rank-volume-manager' ); ?>
			</button>
			<span id="wprvm-bulk-notice" class="wprvm-bulk-notice" aria-live="polite"></span>
		</div>

		<!-- ===================== TABLE ===================== -->
		<table class="wp-list-table widefat fixed striped wprvm-table" id="wprvm-articles-table">
			<thead>
				<tr>
					<th class="column-cb check-column"><span class="screen-reader-text"><?php esc_html_e( '選択', 'wp-rank-volume-manager' ); ?></span></th>
					<th class="column-title"><?php esc_html_e( '記事タイトル', 'wp-rank-volume-manager' ); ?></th>
					<th class="column-keyword"><?php esc_html_e( 'キーワード', 'wp-rank-volume-manager' ); ?></th>
					<th class="column-rank"><?php esc_html_e( '順位', 'wp-rank-volume-manager' ); ?></th>
					<th class="column-volume"><?php esc_html_e( 'ボリューム', 'wp-rank-volume-manager' ); ?></th>
					<th class="column-verdict"><?php esc_html_e( '判定', 'wp-rank-volume-manager' ); ?></th>
					<th class="column-status"><?php esc_html_e( 'ステータス', 'wp-rank-volume-manager' ); ?></th>
					<th class="column-unpublished-at"><?php esc_html_e( '非公開日時', 'wp-rank-volume-manager' ); ?></th>
					<th class="column-actions"><?php esc_html_e( 'アクション', 'wp-rank-volume-manager' ); ?></th>
				</tr>
			</thead>
			<tbody>
			<?php if ( empty( $articles['rows'] ) ) : ?>
				<tr>
					<td colspan="9" style="text-align:center;padding:20px;">
						<?php esc_html_e( '条件に一致する記事がありません。', 'wp-rank-volume-manager' ); ?>
					</td>
				</tr>
			<?php else : ?>
				<?php foreach ( $articles['rows'] as $row ) : ?>
					<?php
					$post_id      = (int) $row->post_id;
					$display_st   = $row->display_status ?? $row->wp_status ?? 'unknown';
					$can_unpublish = ( $row->verdict === 'candidate' || $row->verdict === 'kept' ) && $row->wp_status === 'publish';
					$can_restore   = in_array( $display_st, [ 'auto_unpublished' ], true );
					?>
					<tr data-post-id="<?php echo esc_attr( $post_id ); ?>"
					    data-display-status="<?php echo esc_attr( $display_st ); ?>"
					    id="wprvm-row-<?php echo esc_attr( $post_id ); ?>">
						<th class="check-column">
							<?php if ( $post_id ) : ?>
								<input type="checkbox" class="wprvm-row-check" value="<?php echo esc_attr( $post_id ); ?>">
							<?php endif; ?>
						</th>
						<td class="column-title">
							<?php if ( $post_id ) : ?>
								<strong>
									<a href="<?php echo esc_url( get_edit_post_link( $post_id ) ); ?>" target="_blank">
										<?php echo esc_html( $row->post_title ?: __( '（タイトルなし）', 'wp-rank-volume-manager' ) ); ?>
									</a>
								</strong>
								<div class="row-actions">
									<span><a href="<?php echo esc_url( get_permalink( $post_id ) ); ?>" target="_blank"><?php esc_html_e( '表示', 'wp-rank-volume-manager' ); ?></a></span>
								</div>
							<?php else : ?>
								<span class="wprvm-url-nomatch"><?php echo esc_html( $row->url ); ?></span>
							<?php endif; ?>
						</td>
						<td class="column-keyword"><?php echo esc_html( $row->keyword ?: '—' ); ?></td>
						<td class="column-rank"><?php echo esc_html( $row->rank ?? '—' ); ?></td>
						<td class="column-volume"><?php echo esc_html( $row->volume ?? '—' ); ?></td>
						<td class="column-verdict">
							<?php echo wprvm_verdict_badge( $row->verdict, $row->verdict_reason ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
						</td>
						<td class="column-status">
							<?php echo wprvm_status_badge( $display_st ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
						</td>
						<td class="column-unpublished-at">
							<?php echo $row->unpublished_at ? esc_html( $row->unpublished_at ) : '—'; ?>
						</td>
						<td class="column-actions">
							<div class="wprvm-action-buttons">
								<?php if ( $post_id ) : ?>
									<?php if ( $can_unpublish ) : ?>
										<button class="button wprvm-btn-unpublish"
										        data-post-id="<?php echo esc_attr( $post_id ); ?>"
										        title="<?php esc_attr_e( '非公開にする', 'wp-rank-volume-manager' ); ?>">
											<span class="dashicons dashicons-hidden"></span>
										</button>
									<?php endif; ?>
									<?php if ( $can_restore ) : ?>
										<button class="button wprvm-btn-restore"
										        data-post-id="<?php echo esc_attr( $post_id ); ?>"
										        title="<?php esc_attr_e( '復元する', 'wp-rank-volume-manager' ); ?>">
											<span class="dashicons dashicons-backup"></span>
										</button>
									<?php endif; ?>
									<button class="button wprvm-btn-detail"
									        data-post-id="<?php echo esc_attr( $post_id ); ?>"
									        title="<?php esc_attr_e( '詳細', 'wp-rank-volume-manager' ); ?>">
										<span class="dashicons dashicons-info-outline"></span>
									</button>
								<?php endif; ?>
							</div>
						</td>
					</tr>
				<?php endforeach; ?>
			<?php endif; ?>
			</tbody>
		</table>

		<!-- ===================== PAGINATION ===================== -->
		<?php if ( $articles['total_pages'] > 1 ) : ?>
			<div class="wprvm-pagination tablenav-pages">
				<?php
				echo paginate_links( [ // phpcs:ignore WordPress.Security.EscapeOutput
					'base'      => add_query_arg( 'paged', '%#%', $current_url ),
					'format'    => '',
					'prev_text' => '&laquo;',
					'next_text' => '&raquo;',
					'total'     => $articles['total_pages'],
					'current'   => $articles['paged'],
					'add_args'  => array_filter( [
						'filter_verdict' => $filters['verdict'],
						'filter_status'  => $filters['status'],
						's'              => $filters['s'],
					] ),
				] );
				?>
			</div>
		<?php endif; ?>

	<?php endif; // end if rows ?>

</div><!-- .wprvm-wrap -->

<?php include WPRVM_DIR . 'templates/admin/modal-detail.php'; ?>
