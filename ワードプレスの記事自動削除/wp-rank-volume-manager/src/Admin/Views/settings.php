<?php
/**
 * Settings page view.
 * Available variables: $saved, $options, $post_types, $categories, $tags
 */
defined( 'ABSPATH' ) || exit;
?>

<div class="wrap wprvm-wrap">
	<h1><?php esc_html_e( '設定', 'wp-rank-volume-manager' ); ?></h1>

	<?php if ( $saved ) : ?>
		<div class="notice notice-success is-dismissible"><p><?php esc_html_e( '設定を保存しました。', 'wp-rank-volume-manager' ); ?></p></div>
	<?php endif; ?>

	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<input type="hidden" name="action" value="wprvm_save_settings">
		<?php wp_nonce_field( 'wprvm_save_settings' ); ?>

		<!-- ======================== 基本設定 ======================== -->
		<div class="wprvm-settings-section">
			<h2><?php esc_html_e( '基本設定（閾値・判定ロジック）', 'wp-rank-volume-manager' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row">
						<label for="rank_threshold"><?php esc_html_e( '順位閾値', 'wp-rank-volume-manager' ); ?></label>
					</th>
					<td>
						<input type="number" id="rank_threshold" name="rank_threshold" min="1" max="999"
						       value="<?php echo esc_attr( $options['rank_threshold'] ); ?>">
						<p class="description"><?php esc_html_e( 'この順位以上（悪い）を対象とする。例: 20 → 21位以降が対象。', 'wp-rank-volume-manager' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="volume_threshold"><?php esc_html_e( 'ボリューム閾値', 'wp-rank-volume-manager' ); ?></label>
					</th>
					<td>
						<input type="number" id="volume_threshold" name="volume_threshold" min="0"
						       value="<?php echo esc_attr( $options['volume_threshold'] ); ?>">
						<p class="description"><?php esc_html_e( 'この検索ボリューム以下（少ない）を対象とする。例: 100 → 月間100未満が対象。', 'wp-rank-volume-manager' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( '判定ロジック', 'wp-rank-volume-manager' ); ?></th>
					<td>
						<fieldset>
							<label>
								<input type="radio" name="logic" value="AND" <?php checked( $options['logic'], 'AND' ); ?>>
								<?php esc_html_e( 'AND（順位が閾値以上 かつ ボリュームが閾値以下 → 非公開）', 'wp-rank-volume-manager' ); ?>
							</label><br>
							<label>
								<input type="radio" name="logic" value="OR" <?php checked( $options['logic'], 'OR' ); ?>>
								<?php esc_html_e( 'OR（順位が閾値以上 または ボリュームが閾値以下 → 非公開）', 'wp-rank-volume-manager' ); ?>
							</label>
						</fieldset>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="target_status"><?php esc_html_e( '非公開後のステータス', 'wp-rank-volume-manager' ); ?></label>
					</th>
					<td>
						<select id="target_status" name="target_status">
							<option value="draft"   <?php selected( $options['target_status'], 'draft' ); ?>><?php esc_html_e( '下書き（draft）', 'wp-rank-volume-manager' ); ?></option>
							<option value="private" <?php selected( $options['target_status'], 'private' ); ?>><?php esc_html_e( '非公開（private）', 'wp-rank-volume-manager' ); ?></option>
						</select>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="protection_days"><?php esc_html_e( '新規記事保護期間', 'wp-rank-volume-manager' ); ?></label>
					</th>
					<td>
						<input type="number" id="protection_days" name="protection_days" min="0" max="365"
						       value="<?php echo esc_attr( $options['protection_days'] ); ?>">
						<?php esc_html_e( '日以内に公開された記事は対象外', 'wp-rank-volume-manager' ); ?>
						<p class="description"><?php esc_html_e( '0 にすると保護なし。例: 30 → 公開から30日以内の記事は非公開にしない。', 'wp-rank-volume-manager' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="execution_timing"><?php esc_html_e( '実行タイミング', 'wp-rank-volume-manager' ); ?></label>
					</th>
					<td>
						<select id="execution_timing" name="execution_timing">
							<option value="manual" <?php selected( $options['execution_timing'], 'manual' ); ?>><?php esc_html_e( '手動（CSVインポート時のみ）', 'wp-rank-volume-manager' ); ?></option>
							<option value="cron"   <?php selected( $options['execution_timing'], 'cron' ); ?>><?php esc_html_e( '定期実行（WP-Cron・1日1回）', 'wp-rank-volume-manager' ); ?></option>
						</select>
					</td>
				</tr>
			</table>
		</div>

		<!-- ======================== 対象範囲設定 ======================== -->
		<div class="wprvm-settings-section">
			<h2><?php esc_html_e( '対象範囲設定', 'wp-rank-volume-manager' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><?php esc_html_e( '対象投稿タイプ', 'wp-rank-volume-manager' ); ?></th>
					<td>
						<fieldset>
							<?php foreach ( $post_types as $slug => $label ) : ?>
								<label>
									<input type="checkbox" name="target_post_types[]" value="<?php echo esc_attr( $slug ); ?>"
									       <?php checked( in_array( $slug, (array) $options['target_post_types'], true ) ); ?>>
									<?php echo esc_html( $label ); ?> <code><?php echo esc_html( $slug ); ?></code>
								</label><br>
							<?php endforeach; ?>
						</fieldset>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( '除外カテゴリー', 'wp-rank-volume-manager' ); ?></th>
					<td>
						<div class="wprvm-check-list">
						<?php foreach ( $categories as $cat ) : ?>
							<label>
								<input type="checkbox" name="excluded_categories[]" value="<?php echo esc_attr( $cat->term_id ); ?>"
								       <?php checked( in_array( $cat->term_id, (array) $options['excluded_categories'], true ) ); ?>>
								<?php echo esc_html( $cat->name ); ?>
							</label>
						<?php endforeach; ?>
						</div>
						<p class="description"><?php esc_html_e( 'チェックしたカテゴリーに属する記事は自動非公開の対象外になります。', 'wp-rank-volume-manager' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( '除外タグ', 'wp-rank-volume-manager' ); ?></th>
					<td>
						<div class="wprvm-check-list">
						<?php foreach ( $tags as $tag ) : ?>
							<label>
								<input type="checkbox" name="excluded_tags[]" value="<?php echo esc_attr( $tag->term_id ); ?>"
								       <?php checked( in_array( $tag->term_id, (array) $options['excluded_tags'], true ) ); ?>>
								<?php echo esc_html( $tag->name ); ?>
							</label>
						<?php endforeach; ?>
						</div>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="excluded_post_ids"><?php esc_html_e( '個別除外リスト（投稿ID）', 'wp-rank-volume-manager' ); ?></label>
					</th>
					<td>
						<input type="text" id="excluded_post_ids" name="excluded_post_ids" class="large-text"
						       value="<?php echo esc_attr( $options['excluded_post_ids'] ); ?>"
						       placeholder="123, 456, 789">
						<p class="description"><?php esc_html_e( '除外したい投稿IDをカンマ区切りで入力。ダッシュボードの詳細画面からも個別に追加できます。', 'wp-rank-volume-manager' ); ?></p>
					</td>
				</tr>
			</table>
		</div>

		<!-- ======================== CSVカラムマッピング ======================== -->
		<div class="wprvm-settings-section">
			<h2><?php esc_html_e( 'CSVカラムマッピング', 'wp-rank-volume-manager' ); ?></h2>
			<p class="description"><?php esc_html_e( 'インポートするCSVのヘッダー行に使われているカラム名を指定してください。', 'wp-rank-volume-manager' ); ?></p>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row">
						<label for="csv_url_col"><?php esc_html_e( 'URLカラム名', 'wp-rank-volume-manager' ); ?></label>
					</th>
					<td>
						<input type="text" id="csv_url_col" name="csv_url_col" class="regular-text"
						       value="<?php echo esc_attr( $options['csv_url_col'] ); ?>">
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="csv_keyword_col"><?php esc_html_e( 'キーワードカラム名', 'wp-rank-volume-manager' ); ?></label>
					</th>
					<td>
						<input type="text" id="csv_keyword_col" name="csv_keyword_col" class="regular-text"
						       value="<?php echo esc_attr( $options['csv_keyword_col'] ); ?>">
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="csv_rank_col"><?php esc_html_e( '順位カラム名', 'wp-rank-volume-manager' ); ?></label>
					</th>
					<td>
						<input type="text" id="csv_rank_col" name="csv_rank_col" class="regular-text"
						       value="<?php echo esc_attr( $options['csv_rank_col'] ); ?>">
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="csv_volume_col"><?php esc_html_e( 'ボリュームカラム名', 'wp-rank-volume-manager' ); ?></label>
					</th>
					<td>
						<input type="text" id="csv_volume_col" name="csv_volume_col" class="regular-text"
						       value="<?php echo esc_attr( $options['csv_volume_col'] ); ?>">
					</td>
				</tr>
			</table>
		</div>

		<?php submit_button( __( '設定を保存', 'wp-rank-volume-manager' ) ); ?>
	</form>
</div>
