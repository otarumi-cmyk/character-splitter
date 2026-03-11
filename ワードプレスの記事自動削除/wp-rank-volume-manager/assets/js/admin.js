/* global wprvmData, jQuery */
(function ( $ ) {
	'use strict';

	var i18n  = wprvmData.i18n;
	var ajax  = wprvmData.ajaxurl;
	var nonce = wprvmData.nonce;

	// -----------------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------------

	function getSelectedIds() {
		return $( '.wprvm-row-check:checked' ).map( function () {
			return parseInt( this.value, 10 );
		} ).get();
	}

	function setBulkNotice( msg, type ) {
		$( '#wprvm-bulk-notice' )
			.attr( 'class', 'wprvm-bulk-notice wprvm-bulk-notice--' + ( type || 'info' ) )
			.text( msg );
	}

	function reloadPage() {
		window.location.reload();
	}

	function postAjax( action, data, successCb ) {
		$.post( ajax, $.extend( { action: action, nonce: nonce }, data ), function ( res ) {
			if ( res.success ) {
				successCb( res.data );
			} else {
				setBulkNotice( ( res.data && res.data.message ) || i18n.error, 'error' );
			}
		} ).fail( function () {
			setBulkNotice( i18n.error, 'error' );
		} );
	}

	function escHtml( str ) {
		return $( '<div>' ).text( String( str || '' ) ).html();
	}

	// -----------------------------------------------------------------------
	// File input label update
	// -----------------------------------------------------------------------

	$( '#wprvm-csv-file' ).on( 'change', function () {
		var name = this.files && this.files.length ? this.files[ 0 ].name : '';
		$( '#wprvm-filename' ).text( name || 'CSVファイルを選択' );
	} );

	// -----------------------------------------------------------------------
	// Select-all checkbox
	// -----------------------------------------------------------------------

	$( '#wprvm-select-all' ).on( 'change', function () {
		$( '.wprvm-row-check' ).prop( 'checked', this.checked );
	} );

	$( document ).on( 'change', '.wprvm-row-check', function () {
		var all     = $( '.wprvm-row-check' ).length;
		var checked = $( '.wprvm-row-check:checked' ).length;
		$( '#wprvm-select-all' )
			.prop( 'indeterminate', checked > 0 && checked < all )
			.prop( 'checked', checked === all );
	} );

	// -----------------------------------------------------------------------
	// Bulk Unpublish
	// -----------------------------------------------------------------------

	$( '#wprvm-bulk-unpublish' ).on( 'click', function () {
		var ids = getSelectedIds();
		if ( ! ids.length ) { alert( i18n.no_selection ); return; }
		if ( ! window.confirm( i18n.confirm_unpublish ) ) { return; }

		setBulkNotice( i18n.processing, 'info' );
		$( this ).prop( 'disabled', true );

		postAjax( 'wprvm_unpublish', { post_ids: ids }, function () {
			setBulkNotice( i18n.done, 'success' );
			setTimeout( reloadPage, 800 );
		} );
	} );

	// -----------------------------------------------------------------------
	// Bulk Restore
	// -----------------------------------------------------------------------

	$( '#wprvm-bulk-restore' ).on( 'click', function () {
		var ids = getSelectedIds();
		if ( ! ids.length ) { alert( i18n.no_selection ); return; }
		if ( ! window.confirm( i18n.confirm_restore ) ) { return; }

		setBulkNotice( i18n.processing, 'info' );
		$( this ).prop( 'disabled', true );

		postAjax( 'wprvm_restore', { post_ids: ids }, function () {
			setBulkNotice( i18n.done, 'success' );
			setTimeout( reloadPage, 800 );
		} );
	} );

	// -----------------------------------------------------------------------
	// Per-row Unpublish button
	// -----------------------------------------------------------------------

	$( document ).on( 'click', '.wprvm-btn-unpublish', function () {
		var postId = parseInt( $( this ).data( 'post-id' ), 10 );
		if ( ! window.confirm( i18n.confirm_unpublish ) ) { return; }
		$( this ).prop( 'disabled', true );
		postAjax( 'wprvm_unpublish', { post_ids: [ postId ] }, function () {
			setBulkNotice( i18n.done, 'success' );
			setTimeout( reloadPage, 600 );
		} );
	} );

	// -----------------------------------------------------------------------
	// Per-row Restore button
	// -----------------------------------------------------------------------

	$( document ).on( 'click', '.wprvm-btn-restore', function () {
		var postId = parseInt( $( this ).data( 'post-id' ), 10 );
		if ( ! window.confirm( i18n.confirm_restore ) ) { return; }
		$( this ).prop( 'disabled', true );
		postAjax( 'wprvm_restore', { post_ids: [ postId ] }, function () {
			setBulkNotice( i18n.done, 'success' );
			setTimeout( reloadPage, 600 );
		} );
	} );

	// -----------------------------------------------------------------------
	// Detail modal
	// -----------------------------------------------------------------------

	var $overlay        = $( '#wprvm-modal-overlay' );
	var currentDetailId = null;

	function openModal( postId ) {
		currentDetailId = postId;
		$overlay.removeAttr( 'hidden' );
		$( 'body' ).addClass( 'wprvm-modal-open' );

		// Reset fields
		$( '#wprvm-detail-title' ).text( '...' ).attr( 'href', '#' );
		$( '#wprvm-detail-status' ).text( '...' );
		$( '#wprvm-detail-import-tbody' ).html( '<tr><td colspan="5" class="wprvm-detail-empty">読み込み中...</td></tr>' );
		$( '#wprvm-detail-timeline' ).html( '<p class="wprvm-detail-empty">読み込み中...</p>' );
		$( '#wprvm-detail-unpublish-btn, #wprvm-detail-restore-btn' ).prop( 'hidden', true );
		$( '#wprvm-detail-exclude-check' ).data( 'post-id', postId );

		$.post( ajax, { action: 'wprvm_get_detail', nonce: nonce, post_id: postId }, function ( res ) {
			if ( ! res.success ) { return; }
			var d = res.data;

			$( '#wprvm-detail-title' ).text( d.title ).attr( 'href', d.url );
			$( '#wprvm-detail-status' ).text( d.status );
			$( '#wprvm-detail-exclude-check' ).prop( 'checked', !! d.is_excluded );

			// Import history table rows
			var importHtml = '';
			if ( d.import_history && d.import_history.length ) {
				$.each( d.import_history, function ( i, row ) {
					importHtml += '<tr>'
						+ '<td>' + escHtml( row.imported_at )      + '</td>'
						+ '<td>' + escHtml( row.keyword  || '—' )  + '</td>'
						+ '<td>' + escHtml( row.rank     || '—' )  + '</td>'
						+ '<td>' + escHtml( row.volume   || '—' )  + '</td>'
						+ '<td>' + escHtml( row.verdict )          + '</td>'
						+ '</tr>';
				} );
			} else {
				importHtml = '<tr><td colspan="5" class="wprvm-detail-empty">データなし</td></tr>';
			}
			$( '#wprvm-detail-import-tbody' ).html( importHtml );

			// History timeline
			var actionLabels = {
				auto_unpublish:   '自動非公開',
				manual_unpublish: '手動非公開',
				restore:          '復元'
			};
			var timelineHtml = '';
			if ( d.history && d.history.length ) {
				$.each( d.history, function ( i, h ) {
					var label = actionLabels[ h.action_type ] || h.action_type;
					var cls   = h.action_type === 'restore' ? 'wprvm-timeline-item--restore' : 'wprvm-timeline-item--unpublish';
					timelineHtml += '<div class="wprvm-timeline-item ' + escHtml( cls ) + '">'
						+ '<div class="wprvm-timeline-dot"></div>'
						+ '<div class="wprvm-timeline-content">'
						+ '<strong>' + escHtml( label ) + '</strong>'
						+ ' <span class="wprvm-timeline-date">' + escHtml( h.executed_at ) + '</span>'
						+ '<div class="wprvm-timeline-statuses">'
						+ escHtml( h.prev_status ) + ' &rarr; ' + escHtml( h.new_status )
						+ '</div>'
						+ ( h.rank    ? '<div>順位: '    + escHtml( String( h.rank ) )   + '</div>' : '' )
						+ ( h.volume  ? '<div>ボリューム: ' + escHtml( String( h.volume ) ) + '</div>' : '' )
						+ ( h.keyword ? '<div>キーワード: ' + escHtml( h.keyword )          + '</div>' : '' )
						+ ( h.rule_used && h.rule_used !== 'restore'
							? '<div class="wprvm-timeline-rule">' + escHtml( h.rule_used ) + '</div>'
							: '' )
						+ '</div></div>';
				} );
			} else {
				timelineHtml = '<p class="wprvm-detail-empty">履歴なし</p>';
			}
			$( '#wprvm-detail-timeline' ).html( timelineHtml );

			// Show action buttons
			if ( d.status === 'publish' ) {
				$( '#wprvm-detail-unpublish-btn' ).prop( 'hidden', false );
			} else {
				$( '#wprvm-detail-restore-btn' ).prop( 'hidden', false );
			}
		} );
	}

	function closeModal() {
		$overlay.attr( 'hidden', '' );
		$( 'body' ).removeClass( 'wprvm-modal-open' );
		currentDetailId = null;
	}

	// Open detail modal
	$( document ).on( 'click', '.wprvm-btn-detail', function () {
		openModal( parseInt( $( this ).data( 'post-id' ), 10 ) );
	} );

	// Close modal triggers
	$( '#wprvm-modal-close-btn, #wprvm-modal-close-footer' ).on( 'click', closeModal );
	$( '#wprvm-modal-overlay' ).on( 'click', function ( e ) {
		if ( $( e.target ).is( '#wprvm-modal-overlay' ) ) { closeModal(); }
	} );
	$( document ).on( 'keyup', function ( e ) {
		if ( e.key === 'Escape' ) { closeModal(); }
	} );

	// Modal action buttons
	$( '#wprvm-detail-unpublish-btn' ).on( 'click', function () {
		if ( ! currentDetailId ) { return; }
		if ( ! window.confirm( i18n.confirm_unpublish ) ) { return; }
		postAjax( 'wprvm_unpublish', { post_ids: [ currentDetailId ] }, function () {
			closeModal();
			setBulkNotice( i18n.done, 'success' );
			setTimeout( reloadPage, 600 );
		} );
	} );

	$( '#wprvm-detail-restore-btn' ).on( 'click', function () {
		if ( ! currentDetailId ) { return; }
		if ( ! window.confirm( i18n.confirm_restore ) ) { return; }
		postAjax( 'wprvm_restore', { post_ids: [ currentDetailId ] }, function () {
			closeModal();
			setBulkNotice( i18n.done, 'success' );
			setTimeout( reloadPage, 600 );
		} );
	} );

	// Exclude toggle in modal
	$( '#wprvm-detail-exclude-check' ).on( 'change', function () {
		var postId  = parseInt( $( this ).data( 'post-id' ), 10 );
		var exclude = this.checked ? 1 : 0;
		postAjax( 'wprvm_update_whitelist', { post_id: postId, exclude: exclude }, function () { /* silent */ } );
	} );

}( jQuery ) );
