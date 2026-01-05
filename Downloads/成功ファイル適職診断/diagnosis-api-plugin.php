<?php
/**
 * Plugin Name: 適職診断ツール REST API
 * Plugin URI: https://example.com
 * Description: 適職診断ツール用のREST APIエンドポイントを提供します。診断結果の保存・取得・集計機能を提供します。
 * Version: 2.0.0
 * Author: Your Name
 * Author URI: https://example.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: diagnosis-api
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

/**
 * プラグイン有効化時の処理
 */
function diagnosis_api_activate() {
    // 必要に応じて初期化処理を追加
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'diagnosis_api_activate');

/**
 * プラグイン無効化時の処理
 */
function diagnosis_api_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'diagnosis_api_deactivate');

/**
 * REST APIエンドポイントを登録
 */
add_action('rest_api_init', function () {
    // 診断結果を保存（セッションIDベース）
    register_rest_route('diagnosis/v1', '/save-result', array(
        'methods' => 'POST',
        'callback' => 'diagnosis_api_save_result',
        'permission_callback' => '__return_true',
    ));
    
    // 診断結果を取得（セッションIDベース）
    register_rest_route('diagnosis/v1', '/get-result', array(
        'methods' => 'GET',
        'callback' => 'diagnosis_api_get_result',
        'permission_callback' => '__return_true',
    ));
    
    // 診断結果を保存（lineUserIdベース）
    register_rest_route('diagnosis/v1', '/save-result-by-lineuser', array(
        'methods' => 'POST',
        'callback' => 'diagnosis_api_save_result_by_lineuser',
        'permission_callback' => '__return_true',
    ));
    
    // 診断結果を取得（lineUserIdベース）
    register_rest_route('diagnosis/v1', '/get-result-by-lineuser', array(
        'methods' => 'GET',
        'callback' => 'diagnosis_api_get_result_by_lineuser',
        'permission_callback' => '__return_true',
    ));

    // 診断結果を削除（lineUserIdベース）
    register_rest_route('diagnosis/v1', '/delete-result-by-lineuser', array(
        'methods' => 'POST',
        'callback' => 'diagnosis_api_delete_result_by_lineuser',
        'permission_callback' => '__return_true',
    ));

    // 配布タグ付きユーザーの一覧（管理者のみ）
    register_rest_route('diagnosis/v1', '/list-tagged', array(
        'methods' => 'GET',
        'callback' => 'diagnosis_api_list_tagged',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        },
    ));

    // 最新のPENDING結果を取得してlineUserIdにリンク
    register_rest_route('diagnosis/v1', '/claim-pending-result', array(
        'methods' => 'POST',
        'callback' => 'diagnosis_api_claim_pending_result',
        'permission_callback' => '__return_true',
    ));

    // PENDING結果があるかチェック
    register_rest_route('diagnosis/v1', '/check-pending-result', array(
        'methods' => 'GET',
        'callback' => 'diagnosis_api_check_pending_result',
        'permission_callback' => '__return_true',
    ));

    // 全ユーザー一覧（管理者のみ）
    register_rest_route('diagnosis/v1', '/list-all', array(
        'methods' => 'GET',
        'callback' => 'diagnosis_api_list_all',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        },
    ));

    // 統計情報（管理者のみ）
    register_rest_route('diagnosis/v1', '/stats', array(
        'methods' => 'GET',
        'callback' => 'diagnosis_api_get_stats',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        },
    ));

    // デバッグログを保存（誰でもアクセス可能）
    register_rest_route('diagnosis/v1', '/save-debug-log', array(
        'methods' => 'POST',
        'callback' => 'diagnosis_api_save_debug_log',
        'permission_callback' => '__return_true',
    ));
});

/**
 * 診断結果を保存（セッションIDベース）
 */
function diagnosis_api_save_result($request) {
    $session_id = $request->get_header('X-Session-ID');
    
    if (empty($session_id)) {
        $session_id = 'diag_' . time() . '_' . wp_generate_password(9, false);
    }
    
    $data = $request->get_json_params();
    
    if (!$data || !isset($data['result'])) {
        return new WP_Error('invalid_data', 'Invalid data', array('status' => 400));
    }
    
    $cache_data = array(
        'typeId' => sanitize_text_field($data['result']['typeId']),
        'typeName' => sanitize_text_field($data['result']['typeName']),
        'scores' => $data['result']['scores'],
        'answers' => $data['result']['answers'],
        'additionalAnswers' => isset($data['additionalAnswers']) ? $data['additionalAnswers'] : array(),
        'distributionTag' => isset($data['distributionTag']) ? (bool)$data['distributionTag'] : false,
        'distributionTagDetails' => isset($data['distributionTagDetails']) ? $data['distributionTagDetails'] : array(),
        'timestamp' => time()
    );
    
    $transient_key = 'diagnosis_result_' . $session_id;
    set_transient($transient_key, $cache_data, 24 * HOUR_IN_SECONDS);
    
    // PENDING_LATESTとしても保存（10分有効）
    $pending_data = $cache_data;
    $pending_data['original_session_id'] = $session_id;
    $pending_data['pending_created_at'] = time();
    // PENDING_LATESTは24時間有効（sessionIdと同じ）
    set_transient('diagnosis_result_PENDING_LATEST', $pending_data, 24 * HOUR_IN_SECONDS);
    
    return new WP_REST_Response(array(
        'success' => true,
        'session_id' => $session_id
    ), 200);
}

/**
 * 診断結果を取得（セッションIDベース）
 */
function diagnosis_api_get_result($request) {
    $session_id = $request->get_header('X-Session-ID');
    
    if (empty($session_id)) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'No session ID'
        ), 404);
    }
    
    $transient_key = 'diagnosis_result_' . $session_id;
    $cache_data = get_transient($transient_key);
    
    if ($cache_data === false) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'No result found'
        ), 404);
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'result' => array(
            'typeId' => $cache_data['typeId'],
            'typeName' => $cache_data['typeName'],
            'scores' => $cache_data['scores'],
            'answers' => $cache_data['answers'],
            'additionalAnswers' => isset($cache_data['additionalAnswers']) ? $cache_data['additionalAnswers'] : array(),
            'distributionTag' => isset($cache_data['distributionTag']) ? $cache_data['distributionTag'] : false,
            'distributionTagDetails' => isset($cache_data['distributionTagDetails']) ? $cache_data['distributionTagDetails'] : array(),
            'timestamp' => isset($cache_data['timestamp']) ? $cache_data['timestamp'] : time()
        )
    ), 200);
}

/**
 * 診断結果を保存（lineUserIdベース）- LINE表示名も保存
 */
function diagnosis_api_save_result_by_lineuser($request) {
    $data = $request->get_json_params();
    
    if (!$data || !isset($data['lineUserId']) || !isset($data['result'])) {
        return new WP_Error('invalid_data', 'Invalid data: lineUserId and result are required', array('status' => 400));
    }
    
    $line_user_id = sanitize_text_field($data['lineUserId']);
    
    $cache_data = array(
        'typeId' => sanitize_text_field($data['result']['typeId']),
        'typeName' => sanitize_text_field($data['result']['typeName']),
        'scores' => $data['result']['scores'],
        'answers' => $data['result']['answers'],
        'additionalAnswers' => isset($data['additionalAnswers']) ? $data['additionalAnswers'] : array(),
        'distributionTag' => isset($data['distributionTag']) ? (bool)$data['distributionTag'] : false,
        'distributionTagDetails' => isset($data['distributionTagDetails']) ? $data['distributionTagDetails'] : array(),
        'lineDisplayName' => isset($data['lineDisplayName']) ? sanitize_text_field($data['lineDisplayName']) : '',
        'sessionId' => isset($data['sessionId']) ? sanitize_text_field($data['sessionId']) : '',
        'timestamp' => time()
    );
    
    $transient_key = 'diagnosis_result_lineuser_' . $line_user_id;
    set_transient($transient_key, $cache_data, 24 * HOUR_IN_SECONDS);
    
    return new WP_REST_Response(array(
        'success' => true,
        'lineUserId' => $line_user_id
    ), 200);
}

/**
 * 診断結果を取得（lineUserIdベース）
 */
function diagnosis_api_get_result_by_lineuser($request) {
    $line_user_id = $request->get_param('lineUserId');
    
    if (empty($line_user_id)) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'No lineUserId provided'
        ), 400);
    }
    
    $line_user_id = sanitize_text_field($line_user_id);
    
    $transient_key = 'diagnosis_result_lineuser_' . $line_user_id;
    $cache_data = get_transient($transient_key);
    
    if ($cache_data === false) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'No result found'
        ), 404);
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'result' => array(
            'typeId' => $cache_data['typeId'],
            'typeName' => $cache_data['typeName'],
            'scores' => $cache_data['scores'],
            'answers' => $cache_data['answers'],
            'additionalAnswers' => isset($cache_data['additionalAnswers']) ? $cache_data['additionalAnswers'] : array(),
            'distributionTag' => isset($cache_data['distributionTag']) ? $cache_data['distributionTag'] : false,
            'distributionTagDetails' => isset($cache_data['distributionTagDetails']) ? $cache_data['distributionTagDetails'] : array(),
            'timestamp' => isset($cache_data['timestamp']) ? $cache_data['timestamp'] : time()
        )
    ), 200);
}

/**
 * 診断結果を削除（lineUserIdベース）
 */
function diagnosis_api_delete_result_by_lineuser($request) {
    $data = $request->get_json_params();
    if (!$data || !isset($data['lineUserId'])) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'No lineUserId provided'
        ), 400);
    }
    $line_user_id = sanitize_text_field($data['lineUserId']);
    $transient_key = 'diagnosis_result_lineuser_' . $line_user_id;
    delete_transient($transient_key);

    return new WP_REST_Response(array(
        'success' => true,
        'lineUserId' => $line_user_id
    ), 200);
}

/**
 * PENDING結果があるかチェック
 */
function diagnosis_api_check_pending_result($request) {
    $pending_data = get_transient('diagnosis_result_PENDING_LATEST');
    
    if ($pending_data === false) {
        return new WP_REST_Response(array(
            'success' => false,
            'hasPending' => false,
            'message' => 'No pending result'
        ), 200);
    }
    
    $created_at = isset($pending_data['pending_created_at']) ? $pending_data['pending_created_at'] : 0;
    // 24時間（86400秒）でチェック
    if (time() - $created_at > 86400) {
        delete_transient('diagnosis_result_PENDING_LATEST');
        return new WP_REST_Response(array(
            'success' => false,
            'hasPending' => false,
            'message' => 'Pending result expired'
        ), 200);
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'hasPending' => true,
        'typeId' => $pending_data['typeId'],
        'typeName' => $pending_data['typeName'],
        'createdAt' => $created_at
    ), 200);
}

/**
 * PENDING結果をlineUserIdにリンク
 */
function diagnosis_api_claim_pending_result($request) {
    $data = $request->get_json_params();
    
    if (!$data || !isset($data['lineUserId'])) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'lineUserId is required'
        ), 400);
    }
    
    $line_user_id = sanitize_text_field($data['lineUserId']);
    $line_display_name = isset($data['lineDisplayName']) ? sanitize_text_field($data['lineDisplayName']) : '';
    
    $pending_data = get_transient('diagnosis_result_PENDING_LATEST');
    
    if ($pending_data === false) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'No pending result found'
        ), 404);
    }
    
    $created_at = isset($pending_data['pending_created_at']) ? $pending_data['pending_created_at'] : 0;
    // 24時間（86400秒）でチェック
    if (time() - $created_at > 86400) {
        delete_transient('diagnosis_result_PENDING_LATEST');
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'Pending result expired'
        ), 404);
    }
    
    $cache_data = array(
        'typeId' => $pending_data['typeId'],
        'typeName' => $pending_data['typeName'],
        'scores' => $pending_data['scores'],
        'answers' => $pending_data['answers'],
        'additionalAnswers' => isset($pending_data['additionalAnswers']) ? $pending_data['additionalAnswers'] : array(),
        'distributionTag' => isset($pending_data['distributionTag']) ? $pending_data['distributionTag'] : false,
        'distributionTagDetails' => isset($pending_data['distributionTagDetails']) ? $pending_data['distributionTagDetails'] : array(),
        'lineDisplayName' => $line_display_name,
        'sessionId' => isset($pending_data['original_session_id']) ? $pending_data['original_session_id'] : '',
        'timestamp' => time()
    );
    
    $transient_key = 'diagnosis_result_lineuser_' . $line_user_id;
    set_transient($transient_key, $cache_data, 24 * HOUR_IN_SECONDS);
    
    delete_transient('diagnosis_result_PENDING_LATEST');
    
    return new WP_REST_Response(array(
        'success' => true,
        'lineUserId' => $line_user_id,
        'result' => $cache_data
    ), 200);
}

/**
 * 配布タグ付きユーザーの一覧取得（管理者のみ）
 */
function diagnosis_api_list_tagged() {
    global $wpdb;
    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE %s",
            $wpdb->esc_like('_transient_diagnosis_result_lineuser_') . '%'
        ),
        ARRAY_A
    );

    $items = array();
    foreach ($rows as $row) {
        $line_user_id = str_replace('_transient_diagnosis_result_lineuser_', '', $row['option_name']);
        $data = maybe_unserialize($row['option_value']);
        if (!is_array($data)) {
            continue;
        }
        $tag = isset($data['distributionTag']) ? (bool)$data['distributionTag'] : false;
        if ($tag) {
            $items[] = diagnosis_api_format_user_data($line_user_id, $data);
        }
    }

    return new WP_REST_Response(array(
        'success' => true,
        'count' => count($items),
        'items' => $items
    ), 200);
}

/**
 * 全ユーザー一覧取得（管理者のみ）
 */
function diagnosis_api_list_all() {
    global $wpdb;
    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE %s",
            $wpdb->esc_like('_transient_diagnosis_result_lineuser_') . '%'
        ),
        ARRAY_A
    );

    $items = array();
    foreach ($rows as $row) {
        $line_user_id = str_replace('_transient_diagnosis_result_lineuser_', '', $row['option_name']);
        $data = maybe_unserialize($row['option_value']);
        if (!is_array($data)) {
            continue;
        }
        $items[] = diagnosis_api_format_user_data($line_user_id, $data);
    }

    return new WP_REST_Response(array(
        'success' => true,
        'count' => count($items),
        'items' => $items
    ), 200);
}

/**
 * additionalAnswersから値を抽出するヘルパー関数
 * 構造: {value: "25-29歳", isTargetAge: true} または文字列
 * フォールバック: prefecture, jobChangeTiming など個別フィールドも確認
 */
function diagnosis_api_extract_value($field, $question_type = '') {
    if (empty($field)) {
        return '';
    }
    // 文字列や数値の場合はそのまま返す
    if (!is_array($field)) {
        return strval($field);
    }
    // 配列/オブジェクトの場合はvalueフィールドを優先
    if (isset($field['value'])) {
        return strval($field['value']);
    }
    
    // 年齢の場合: minAge/maxAge から表示ラベルを生成
    if ($question_type === 'age' && isset($field['minAge']) && isset($field['maxAge'])) {
        $min = intval($field['minAge']);
        $max = intval($field['maxAge']);
        if ($max >= 100) {
            return $min . '歳以上';
        }
        return $min . '-' . $max . '歳';
    }
    
    // 住まいの場合: prefectureフィールド
    if (isset($field['prefecture'])) {
        return strval($field['prefecture']);
    }
    
    // 転職時期の場合: jobChangeTimingから表示ラベルを生成
    if ($question_type === 'jobChangeTiming' && isset($field['jobChangeTiming'])) {
        $timing_labels = array(
            '1month' => 'すぐに（1ヶ月以内）',
            '3months' => '3ヶ月以内',
            '6months' => '6ヶ月以内',
            '1year' => '1年以内',
            '1yearplus' => '1年以上先',
            'not_considered' => '転職は考えていない'
        );
        $timing = $field['jobChangeTiming'];
        return isset($timing_labels[$timing]) ? $timing_labels[$timing] : $timing;
    }
    
    // 転職回数の場合: jobChangeCountから表示ラベルを生成
    if ($question_type === 'jobChangeCount' && isset($field['jobChangeCount'])) {
        $count_labels = array(
            0 => '転職経験なし（1社目）',
            1 => '1回（2社目）',
            2 => '2回（3社目）',
            3 => '3回以上（4社目以上）'
        );
        $count = intval($field['jobChangeCount']);
        return isset($count_labels[$count]) ? $count_labels[$count] : $count . '回';
    }
    
    return '';
}

/**
 * タイムスタンプを正規化するヘルパー関数
 * JavaScript (ミリ秒) と PHP (秒) の両方に対応
 */
function diagnosis_api_normalize_timestamp($timestamp) {
    if (empty($timestamp)) {
        return 0;
    }
    $ts = intval($timestamp);
    // 13桁以上（ミリ秒）の場合は秒に変換
    if ($ts > 10000000000) {
        $ts = intval($ts / 1000);
    }
    return $ts;
}

/**
 * ユーザーデータを整形
 */
function diagnosis_api_format_user_data($line_user_id, $data) {
    $additional = isset($data['additionalAnswers']) ? $data['additionalAnswers'] : array();
    
    return array(
        'lineUserId' => $line_user_id,
        'lineDisplayName' => isset($data['lineDisplayName']) ? $data['lineDisplayName'] : '',
        'sessionId' => isset($data['sessionId']) ? $data['sessionId'] : '',
        'typeId' => isset($data['typeId']) ? $data['typeId'] : '',
        'typeName' => isset($data['typeName']) ? $data['typeName'] : '',
        'age' => diagnosis_api_extract_value(isset($additional['age']) ? $additional['age'] : '', 'age'),
        'location' => diagnosis_api_extract_value(isset($additional['location']) ? $additional['location'] : '', 'location'),
        'jobChangeTiming' => diagnosis_api_extract_value(isset($additional['jobChangeTiming']) ? $additional['jobChangeTiming'] : '', 'jobChangeTiming'),
        'jobChangeCount' => diagnosis_api_extract_value(isset($additional['jobChangeCount']) ? $additional['jobChangeCount'] : '', 'jobChangeCount'),
        'distributionTag' => isset($data['distributionTag']) ? (bool)$data['distributionTag'] : false,
        'distributionTagDetails' => isset($data['distributionTagDetails']) ? $data['distributionTagDetails'] : array(),
        'timestamp' => diagnosis_api_normalize_timestamp(isset($data['timestamp']) ? $data['timestamp'] : 0)
    );
}

/**
 * 統計情報を取得（管理者のみ）
 */
function diagnosis_api_get_stats() {
    global $wpdb;
    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE %s",
            $wpdb->esc_like('_transient_diagnosis_result_lineuser_') . '%'
        ),
        ARRAY_A
    );

    $total = 0;
    $tagged = 0;
    $today = 0;
    $today_start = strtotime('today');
    
    $age_distribution = array();
    $location_distribution = array();
    $timing_distribution = array();
    $job_change_distribution = array();
    $type_distribution = array();
    $tag_detail_distribution = array(
        'age' => array('true' => 0, 'false' => 0),
        'location' => array('true' => 0, 'false' => 0),
        'timing' => array('true' => 0, 'false' => 0),
        'jobChangeCount' => array('true' => 0, 'false' => 0)
    );

    foreach ($rows as $row) {
        $data = maybe_unserialize($row['option_value']);
        if (!is_array($data)) {
            continue;
        }
        
        $total++;
        
        // 配布タグ
        if (isset($data['distributionTag']) && $data['distributionTag']) {
            $tagged++;
        }
        
        // 本日の診断数
        $ts = diagnosis_api_normalize_timestamp(isset($data['timestamp']) ? $data['timestamp'] : 0);
        if ($ts >= $today_start) {
            $today++;
        }
        
        // 追加質問の集計
        $additional = isset($data['additionalAnswers']) ? $data['additionalAnswers'] : array();
        
        $age = diagnosis_api_extract_value(isset($additional['age']) ? $additional['age'] : '', 'age');
        if (!empty($age)) {
            $age_distribution[$age] = isset($age_distribution[$age]) ? $age_distribution[$age] + 1 : 1;
        }
        
        $loc = diagnosis_api_extract_value(isset($additional['location']) ? $additional['location'] : '', 'location');
        if (!empty($loc)) {
            $location_distribution[$loc] = isset($location_distribution[$loc]) ? $location_distribution[$loc] + 1 : 1;
        }
        
        $timing = diagnosis_api_extract_value(isset($additional['jobChangeTiming']) ? $additional['jobChangeTiming'] : '', 'jobChangeTiming');
        if (!empty($timing)) {
            $timing_distribution[$timing] = isset($timing_distribution[$timing]) ? $timing_distribution[$timing] + 1 : 1;
        }
        
        $jc = diagnosis_api_extract_value(isset($additional['jobChangeCount']) ? $additional['jobChangeCount'] : '', 'jobChangeCount');
        if (!empty($jc)) {
            $job_change_distribution[$jc] = isset($job_change_distribution[$jc]) ? $job_change_distribution[$jc] + 1 : 1;
        }
        
        // タイプ分布
        if (isset($data['typeName']) && !empty($data['typeName'])) {
            $type = $data['typeName'];
            $type_distribution[$type] = isset($type_distribution[$type]) ? $type_distribution[$type] + 1 : 1;
        }
        
        // タグ詳細の集計
        $details = isset($data['distributionTagDetails']) ? $data['distributionTagDetails'] : array();
        foreach ($tag_detail_distribution as $key => &$vals) {
            if (isset($details[$key])) {
                $vals[$details[$key] ? 'true' : 'false']++;
            }
        }
    }

    return new WP_REST_Response(array(
        'success' => true,
        'total' => $total,
        'tagged' => $tagged,
        'taggedRate' => $total > 0 ? round($tagged / $total * 100, 1) : 0,
        'today' => $today,
        'ageDistribution' => $age_distribution,
        'locationDistribution' => $location_distribution,
        'timingDistribution' => $timing_distribution,
        'jobChangeDistribution' => $job_change_distribution,
        'typeDistribution' => $type_distribution,
        'tagDetailDistribution' => $tag_detail_distribution
    ), 200);
}

/**
 * デバッグログを保存（txtファイルとして）
 */
function diagnosis_api_save_debug_log($request) {
    $data = $request->get_json_params();
    
    if (!$data || !isset($data['logs']) || empty($data['logs'])) {
        return new WP_Error('invalid_data', 'Logs are required', array('status' => 400));
    }
    
    $logs = is_array($data['logs']) ? implode("\n", $data['logs']) : $data['logs'];
    $line_user_id = isset($data['lineUserId']) ? sanitize_text_field($data['lineUserId']) : 'unknown';
    $session_id = isset($data['sessionId']) ? sanitize_text_field($data['sessionId']) : 'unknown';
    
    // WordPressのアップロードディレクトリを取得
    $upload_dir = wp_upload_dir();
    $debug_dir = $upload_dir['basedir'] . '/diagnosis-debug-logs';
    
    // ディレクトリが存在しない場合は作成
    if (!file_exists($debug_dir)) {
        wp_mkdir_p($debug_dir);
    }
    
    // ファイル名を生成（タイムスタンプ + lineUserId + sessionId）
    $timestamp = date('Y-m-d_H-i-s');
    $filename = sprintf('debug-log_%s_%s_%s.txt', $timestamp, substr($line_user_id, 0, 8), substr($session_id, 0, 6));
    $filepath = $debug_dir . '/' . $filename;
    
    // ファイルに書き込み
    $file_content = "=== デバッグログ ===\n";
    $file_content .= "日時: " . date('Y-m-d H:i:s') . "\n";
    $file_content .= "LINE User ID: " . $line_user_id . "\n";
    $file_content .= "Session ID: " . $session_id . "\n";
    $file_content .= "URL: " . (isset($data['url']) ? $data['url'] : 'N/A') . "\n";
    $file_content .= "========================================\n\n";
    $file_content .= $logs;
    
    $result = file_put_contents($filepath, $file_content);
    
    if ($result === false) {
        return new WP_Error('file_write_error', 'Failed to write log file', array('status' => 500));
    }
    
    // ファイルURLを生成
    $file_url = $upload_dir['baseurl'] . '/diagnosis-debug-logs/' . $filename;
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Debug log saved successfully',
        'filename' => $filename,
        'filepath' => $filepath,
        'fileurl' => $file_url
    ), 200);
}

/**
 * 管理画面に「診断結果ダッシュボード」を追加
 */
add_action('admin_menu', function() {
    add_menu_page(
        '診断結果ダッシュボード',
        '診断結果',
        'manage_options',
        'diagnosis-dashboard',
        'diagnosis_api_render_dashboard',
        'dashicons-visibility',
        58
    );
    
    add_submenu_page(
        'diagnosis-dashboard',
        'サマリー',
        'サマリー',
        'manage_options',
        'diagnosis-dashboard',
        'diagnosis_api_render_dashboard'
    );
    
    add_submenu_page(
        'diagnosis-dashboard',
        'ユーザー一覧',
        'ユーザー一覧',
        'manage_options',
        'diagnosis-users',
        'diagnosis_api_render_users'
    );
    
    add_submenu_page(
        'diagnosis-dashboard',
        'デバッグログ',
        'デバッグログ',
        'manage_options',
        'diagnosis-debug-logs',
        'diagnosis_api_render_debug_logs'
    );
});

/**
 * ダッシュボード画面の描画（サマリー）
 */
function diagnosis_api_render_dashboard() {
    if (!current_user_can('manage_options')) {
        wp_die('権限がありません');
    }

    $stats = diagnosis_api_get_stats_for_admin();
    
    ?>
    <div class="wrap">
        <h1>📊 診断結果ダッシュボード</h1>
        
        <style>
            .diagnosis-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            .diagnosis-stat-card {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
            }
            .diagnosis-stat-card h2 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #666;
            }
            .diagnosis-stat-card .number {
                font-size: 36px;
                font-weight: bold;
                color: #2271b1;
            }
            .diagnosis-stat-card .sub {
                font-size: 14px;
                color: #666;
            }
            .diagnosis-distribution {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .diagnosis-distribution h3 {
                margin-top: 0;
            }
            .diagnosis-bar {
                display: flex;
                align-items: center;
                margin: 8px 0;
            }
            .diagnosis-bar-label {
                width: 150px;
                font-size: 13px;
            }
            .diagnosis-bar-container {
                flex: 1;
                height: 20px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
            }
            .diagnosis-bar-fill {
                height: 100%;
                background: #2271b1;
                border-radius: 4px;
            }
            .diagnosis-bar-value {
                width: 80px;
                text-align: right;
                font-size: 13px;
                padding-left: 10px;
            }
        </style>
        
        <div class="diagnosis-stats-grid">
            <div class="diagnosis-stat-card">
                <h2>総診断数</h2>
                <div class="number"><?php echo esc_html($stats['total']); ?></div>
                <div class="sub">人</div>
            </div>
            <div class="diagnosis-stat-card">
                <h2>配布タグ対象</h2>
                <div class="number"><?php echo esc_html($stats['tagged']); ?></div>
                <div class="sub"><?php echo esc_html($stats['taggedRate']); ?>%</div>
            </div>
            <div class="diagnosis-stat-card">
                <h2>本日の診断数</h2>
                <div class="number"><?php echo esc_html($stats['today']); ?></div>
                <div class="sub">人</div>
            </div>
        </div>
        
        <div class="diagnosis-distribution">
            <h3>📝 年齢分布</h3>
            <?php diagnosis_api_render_bar_chart($stats['ageDistribution'], $stats['total']); ?>
        </div>
        
        <div class="diagnosis-distribution">
            <h3>📍 住まい分布</h3>
            <?php diagnosis_api_render_bar_chart($stats['locationDistribution'], $stats['total']); ?>
        </div>
        
        <div class="diagnosis-distribution">
            <h3>📅 転職時期分布</h3>
            <?php diagnosis_api_render_bar_chart($stats['timingDistribution'], $stats['total']); ?>
        </div>
        
        <div class="diagnosis-distribution">
            <h3>🔄 転職回数分布</h3>
            <?php diagnosis_api_render_bar_chart($stats['jobChangeDistribution'], $stats['total']); ?>
        </div>
        
        <div class="diagnosis-distribution">
            <h3>🎯 診断タイプ分布</h3>
            <?php diagnosis_api_render_bar_chart($stats['typeDistribution'], $stats['total']); ?>
        </div>
        
        <div class="diagnosis-distribution">
            <h3>🏷️ 配布タグ条件別（該当率）</h3>
            <?php 
            $tag_details = $stats['tagDetailDistribution'];
            $labels = array(
                'age' => '年齢（20-29歳）',
                'location' => '住まい（対象エリア）',
                'timing' => '転職時期（1年以内）',
                'jobChangeCount' => '転職回数（2回まで）'
            );
            foreach ($tag_details as $key => $vals) {
                $true_count = $vals['true'];
                $total_for_this = $vals['true'] + $vals['false'];
                $rate = $total_for_this > 0 ? round($true_count / $total_for_this * 100, 1) : 0;
                echo '<div class="diagnosis-bar">';
                echo '<div class="diagnosis-bar-label">' . esc_html($labels[$key]) . '</div>';
                echo '<div class="diagnosis-bar-container"><div class="diagnosis-bar-fill" style="width: ' . esc_attr($rate) . '%;"></div></div>';
                echo '<div class="diagnosis-bar-value">' . esc_html($true_count) . '人 (' . esc_html($rate) . '%)</div>';
                echo '</div>';
            }
            ?>
        </div>
    </div>
    <?php
}

/**
 * 棒グラフを描画
 */
function diagnosis_api_render_bar_chart($distribution, $total) {
    if (empty($distribution)) {
        echo '<p>データがありません</p>';
        return;
    }
    
    arsort($distribution);
    
    foreach ($distribution as $label => $count) {
        $rate = $total > 0 ? round($count / $total * 100, 1) : 0;
        echo '<div class="diagnosis-bar">';
        echo '<div class="diagnosis-bar-label">' . esc_html($label) . '</div>';
        echo '<div class="diagnosis-bar-container"><div class="diagnosis-bar-fill" style="width: ' . esc_attr($rate) . '%;"></div></div>';
        echo '<div class="diagnosis-bar-value">' . esc_html($count) . '人 (' . esc_html($rate) . '%)</div>';
        echo '</div>';
    }
}

/**
 * ユーザー一覧画面の描画
 */
function diagnosis_api_render_users() {
    if (!current_user_can('manage_options')) {
        wp_die('権限がありません');
    }

    $filter = isset($_GET['filter']) ? sanitize_text_field($_GET['filter']) : 'all';
    $items = diagnosis_api_list_all_for_admin($filter);
    $count = count($items);

    ?>
    <div class="wrap">
        <h1>👥 ユーザー一覧</h1>
        
        <p>
            <a class="button <?php echo $filter === 'all' ? 'button-primary' : ''; ?>" href="<?php echo esc_url(admin_url('admin.php?page=diagnosis-users&filter=all')); ?>">全て (<?php echo esc_html($count); ?>)</a>
            <a class="button <?php echo $filter === 'tagged' ? 'button-primary' : ''; ?>" href="<?php echo esc_url(admin_url('admin.php?page=diagnosis-users&filter=tagged')); ?>">配布タグのみ</a>
            <a class="button button-secondary" href="<?php echo esc_url(admin_url('admin-post.php?action=diagnosis_export_csv_all&filter=' . $filter)); ?>">📥 CSVダウンロード</a>
        </p>
        
        <table class="widefat fixed striped">
            <thead>
                <tr>
                    <th style="width: 90px;">セッションID</th>
                    <th style="width: 150px;">LINE User ID</th>
                    <th style="width: 90px;">LINE名</th>
                    <th style="width: 90px;">タイプ</th>
                    <th style="width: 65px;">年齢</th>
                    <th style="width: 65px;">住まい</th>
                    <th style="width: 85px;">転職時期</th>
                    <th style="width: 95px;">転職回数</th>
                    <th style="width: 35px;">配布</th>
                    <th style="width: 120px;">登録日時</th>
                </tr>
            </thead>
            <tbody>
                <?php if ($count === 0): ?>
                    <tr><td colspan="10">データがありません。</td></tr>
                <?php else: ?>
                    <?php foreach ($items as $row): ?>
                        <tr>
                            <td style="font-size: 10px; font-family: monospace;"><?php echo esc_html($row['sessionId'] ?: '-'); ?></td>
                            <td style="font-size: 10px; font-family: monospace;"><?php echo esc_html($row['lineUserId'] ?: '-'); ?></td>
                            <td><?php echo esc_html($row['lineDisplayName'] ?: '(未取得)'); ?></td>
                            <td><?php echo esc_html($row['typeName']); ?></td>
                            <td><?php echo esc_html($row['age']); ?></td>
                            <td><?php echo esc_html($row['location']); ?></td>
                            <td><?php echo esc_html($row['jobChangeTiming']); ?></td>
                            <td><?php echo esc_html($row['jobChangeCount']); ?></td>
                            <td><?php echo $row['distributionTag'] ? '✅' : '—'; ?></td>
                            <td><?php echo !empty($row['timestamp']) ? esc_html(date_i18n('Y-m-d H:i', diagnosis_api_normalize_timestamp($row['timestamp']))) : ''; ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php
}

/**
 * 管理画面用：統計データを取得
 */
function diagnosis_api_get_stats_for_admin() {
    $response = diagnosis_api_get_stats();
    return $response->get_data();
}

/**
 * 管理画面用：全ユーザーの配列を取得
 */
function diagnosis_api_list_all_for_admin($filter = 'all') {
    global $wpdb;
    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE %s",
            $wpdb->esc_like('_transient_diagnosis_result_lineuser_') . '%'
        ),
        ARRAY_A
    );

    $items = array();
    foreach ($rows as $row) {
        $line_user_id = str_replace('_transient_diagnosis_result_lineuser_', '', $row['option_name']);
        $data = maybe_unserialize($row['option_value']);
        if (!is_array($data)) {
            continue;
        }
        
        $tag = isset($data['distributionTag']) ? (bool)$data['distributionTag'] : false;
        
        if ($filter === 'tagged' && !$tag) {
            continue;
        }
        
        $items[] = diagnosis_api_format_user_data($line_user_id, $data);
    }
    
    // タイムスタンプで降順ソート
    usort($items, function($a, $b) {
        return intval($b['timestamp']) - intval($a['timestamp']);
    });
    
    return $items;
}

/**
 * CSVダウンロード（全ユーザー対応）
 */
add_action('admin_post_diagnosis_export_csv_all', function() {
    if (!current_user_can('manage_options')) {
        wp_die('権限がありません');
    }
    
    $filter = isset($_GET['filter']) ? sanitize_text_field($_GET['filter']) : 'all';
    $items = diagnosis_api_list_all_for_admin($filter);

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename=diagnosis_results_' . date('Ymd_His') . '.csv');

    $output = fopen('php://output', 'w');
    
    // BOMを出力（Excel対応）
    fwrite($output, "\xEF\xBB\xBF");
    
    fputcsv($output, array(
        'LINE User ID',
        'LINE表示名',
        'セッションID',
        'タイプID',
        'タイプ名',
        '年齢',
        '住まい',
        '転職時期',
        '転職回数',
        '配布タグ',
        '配布タグ詳細',
        '登録日時'
    ));
    
    foreach ($items as $row) {
        fputcsv($output, array(
            $row['lineUserId'],
            $row['lineDisplayName'],
            $row['sessionId'],
            $row['typeId'],
            $row['typeName'],
            $row['age'],
            $row['location'],
            $row['jobChangeTiming'],
            $row['jobChangeCount'],
            $row['distributionTag'] ? 'はい' : 'いいえ',
            json_encode($row['distributionTagDetails'], JSON_UNESCAPED_UNICODE),
            !empty($row['timestamp']) ? date_i18n('Y-m-d H:i:s', diagnosis_api_normalize_timestamp($row['timestamp'])) : ''
        ));
    }
    fclose($output);
    exit;
});

// 旧CSVエンドポイントも残す（後方互換）
add_action('admin_post_diagnosis_export_csv', function() {
    if (!current_user_can('manage_options')) {
        wp_die('権限がありません');
    }
    $items = diagnosis_api_list_all_for_admin('tagged');

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename=diagnosis_distribution_tag.csv');

    $output = fopen('php://output', 'w');
    fwrite($output, "\xEF\xBB\xBF");
    fputcsv($output, array('lineUserId', 'typeId', 'typeName', 'distributionTagDetails', 'timestamp'));
    foreach ($items as $row) {
        fputcsv($output, array(
            $row['lineUserId'],
            $row['typeId'],
            $row['typeName'],
            json_encode($row['distributionTagDetails'], JSON_UNESCAPED_UNICODE),
            $row['timestamp']
        ));
    }
    fclose($output);
    exit;
});

/**
 * デバッグログ一覧画面の描画
 */
function diagnosis_api_render_debug_logs() {
    if (!current_user_can('manage_options')) {
        wp_die('権限がありません');
    }

    // アップロードディレクトリを取得
    $upload_dir = wp_upload_dir();
    $debug_dir = $upload_dir['basedir'] . '/diagnosis-debug-logs';
    $debug_url = $upload_dir['baseurl'] . '/diagnosis-debug-logs';
    
    // ディレクトリが存在しない場合は作成
    if (!file_exists($debug_dir)) {
        wp_mkdir_p($debug_dir);
    }
    
    // ファイル削除処理
    if (isset($_GET['delete']) && isset($_GET['_wpnonce'])) {
        if (wp_verify_nonce($_GET['_wpnonce'], 'delete_debug_log')) {
            $file_to_delete = sanitize_file_name($_GET['delete']);
            $filepath = $debug_dir . '/' . $file_to_delete;
            if (file_exists($filepath) && strpos($filepath, $debug_dir) === 0) {
                unlink($filepath);
                echo '<div class="notice notice-success"><p>ファイルを削除しました: ' . esc_html($file_to_delete) . '</p></div>';
            }
        }
    }
    
    // ファイル一覧を取得
    $files = array();
    if (is_dir($debug_dir)) {
        $all_files = scandir($debug_dir);
        foreach ($all_files as $file) {
            if ($file === '.' || $file === '..') continue;
            if (pathinfo($file, PATHINFO_EXTENSION) === 'txt') {
                $filepath = $debug_dir . '/' . $file;
                $files[] = array(
                    'name' => $file,
                    'path' => $filepath,
                    'url' => $debug_url . '/' . $file,
                    'size' => filesize($filepath),
                    'modified' => filemtime($filepath)
                );
            }
        }
    }
    
    // 更新日時で降順ソート
    usort($files, function($a, $b) {
        return $b['modified'] - $a['modified'];
    });
    
    ?>
    <div class="wrap">
        <h1>🔍 デバッグログ</h1>
        <p>診断画面から送信されたデバッグログファイル一覧です。</p>
        <p><strong>保存先:</strong> <code><?php echo esc_html($debug_dir); ?></code></p>
        <p><strong>件数:</strong> <?php echo count($files); ?> 件</p>
        
        <table class="widefat fixed striped">
            <thead>
                <tr>
                    <th style="width: 40%;">ファイル名</th>
                    <th style="width: 15%;">サイズ</th>
                    <th style="width: 20%;">更新日時</th>
                    <th style="width: 25%;">操作</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($files)): ?>
                    <tr><td colspan="4">デバッグログファイルがありません。</td></tr>
                <?php else: ?>
                    <?php foreach ($files as $file): ?>
                        <tr>
                            <td style="font-family: monospace; font-size: 12px;"><?php echo esc_html($file['name']); ?></td>
                            <td><?php echo size_format($file['size']); ?></td>
                            <td><?php echo date_i18n('Y-m-d H:i:s', $file['modified']); ?></td>
                            <td>
                                <a href="<?php echo esc_url($file['url']); ?>" class="button button-small" target="_blank">📄 表示</a>
                                <a href="<?php echo esc_url($file['url']); ?>" class="button button-small" download>💾 DL</a>
                                <a href="<?php echo esc_url(admin_url('admin.php?page=diagnosis-debug-logs&delete=' . urlencode($file['name']) . '&_wpnonce=' . wp_create_nonce('delete_debug_log'))); ?>" class="button button-small" onclick="return confirm('このファイルを削除しますか？');">🗑️ 削除</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
        
        <?php if (!empty($files)): ?>
        <h2 style="margin-top: 30px;">📄 最新ログのプレビュー</h2>
        <div style="background: #1a1a1a; color: #0f0; font-family: monospace; font-size: 11px; padding: 15px; border-radius: 8px; max-height: 400px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;">
<?php
            $latest_file = $files[0]['path'];
            $content = file_get_contents($latest_file);
            echo esc_html($content);
?>
        </div>
        <?php endif; ?>
    </div>
    <?php
}
