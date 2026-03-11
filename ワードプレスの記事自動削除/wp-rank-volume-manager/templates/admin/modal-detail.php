<?php
/**
 * Detail modal — rendered in the dashboard view.
 * Populated dynamically via JS after an AJAX call to wprvm_get_detail.
 */
defined( 'ABSPATH' ) || exit;
?>

<div id="wprvm-modal-overlay" class="wprvm-modal-overlay" hidden>
	<div class="wprvm-modal" role="dialog" aria-modal="true" aria-labelledby="wprvm-modal-title">

		<div class="wprvm-modal-header">
			<h2 id="wprvm-modal-title"><?php esc_html_e( '記事詳細', 'wp-rank-volume-manager' ); ?></h2>
			<button class="wprvm-modal-close" id="wprvm-modal-close-btn" aria-label="<?php esc_attr_e( '閉じる', 'wp-rank-volume-manager' ); ?>">
				<span class="dashicons dashicons-no-alt"></span>
			</button>
		</div>

		<div class="wprvm-modal-body">

			<!-- Article info -->
			<div class="wprvm-detail-meta">
				<table class="widefat wprvm-detail-table">
					<tr>
						<th><?php esc_html_e( 'タイトル', 'wp-rank-volume-manager' ); ?></th>
						<td><strong><a id="wprvm-detail-title" href="#" target="_blank">—</a></strong></td>
					</tr>
					<tr>
						<th><?php esc_html_e( 'ステータス', 'wp-rank-volume-manager' ); ?></th>
						<td id="wprvm-detail-status">—</td>
					</tr>
				</table>
			</div>

			<!-- Import history (last 5) -->
			<h3><?php esc_html_e( '直近のインポートデータ', 'wp-rank-volume-manager' ); ?></h3>
			<table class="widefat wprvm-detail-import-table">
				<thead>
					<tr>
						<th><?php esc_html_e( 'インポート日時', 'wp-rank-volume-manager' ); ?></th>
						<th><?php esc_html_e( 'キーワード', 'wp-rank-volume-manager' ); ?></th>
						<th><?php esc_html_e( '順位', 'wp-rank-volume-manager' ); ?></th>
						<th><?php esc_html_e( 'ボリューム', 'wp-rank-volume-manager' ); ?></th>
						<th><?php esc_html_e( '判定', 'wp-rank-volume-manager' ); ?></th>
					</tr>
				</thead>
				<tbody id="wprvm-detail-import-tbody">
					<tr><td colspan="5" class="wprvm-detail-empty"><?php esc_html_e( '読み込み中...', 'wp-rank-volume-manager' ); ?></td></tr>
				</tbody>
			</table>

			<!-- Action history timeline -->
			<h3><?php esc_html_e( 'アクション履歴', 'wp-rank-volume-manager' ); ?></h3>
			<div id="wprvm-detail-timeline" class="wprvm-timeline">
				<p class="wprvm-detail-empty"><?php esc_html_e( '読み込み中...', 'wp-rank-volume-manager' ); ?></p>
			</div>

			<!-- Exclude toggle -->
			<div class="wprvm-detail-exclude">
				<label>
					<input type="checkbox" id="wprvm-detail-exclude-check" data-post-id="">
					<?php esc_html_e( 'この記事を自動管理の対象外にする（除外リストに追加）', 'wp-rank-volume-manager' ); ?>
				</label>
			</div>

		</div><!-- .wprvm-modal-body -->

		<div class="wprvm-modal-footer">
			<button id="wprvm-detail-unpublish-btn" class="button button-primary" hidden>
				<span class="dashicons dashicons-hidden"></span>
				<?php esc_html_e( '非公開にする', 'wp-rank-volume-manager' ); ?>
			</button>
			<button id="wprvm-detail-restore-btn" class="button" hidden>
				<span class="dashicons dashicons-backup"></span>
				<?php esc_html_e( '復元する', 'wp-rank-volume-manager' ); ?>
			</button>
			<button id="wprvm-modal-close-footer" class="button">
				<?php esc_html_e( '閉じる', 'wp-rank-volume-manager' ); ?>
			</button>
		</div>

	</div><!-- .wprvm-modal -->
</div><!-- .wprvm-modal-overlay -->
