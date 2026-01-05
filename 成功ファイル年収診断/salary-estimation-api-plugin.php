<?php
/**
 * Plugin Name: 想定年収診断 REST API
 * Plugin URI: https://example.com
 * Description: 想定年収診断ツール用のREST APIエンドポイントを提供します。診断結果の保存・取得・集計機能を提供します。
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://example.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: salary-estimation-api
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

/**
 * プラグイン有効化時の処理
 */
function salary_api_activate() {
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'salary_api_activate');

/**
 * プラグイン無効化時の処理
 */
function salary_api_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'salary_api_deactivate');

/**
 * REST APIエンドポイントを登録
 */
add_action('rest_api_init', function () {
    // 診断結果を保存（セッションIDベース）
    register_rest_route('salary-estimation/v1', '/save-result', array(
        'methods' => 'POST',
        'callback' => 'salary_api_save_result',
        'permission_callback' => '__return_true',
    ));
    
    // 診断結果を取得（セッションIDベース）
    register_rest_route('salary-estimation/v1', '/get-result', array(
        'methods' => 'GET',
        'callback' => 'salary_api_get_result',
        'permission_callback' => '__return_true',
    ));
    
    // 診断結果を保存（lineUserIdベース）
    register_rest_route('salary-estimation/v1', '/save-result-by-lineuser', array(
        'methods' => 'POST',
        'callback' => 'salary_api_save_result_by_lineuser',
        'permission_callback' => '__return_true',
    ));
    
    // 診断結果を取得（lineUserIdベース）
    register_rest_route('salary-estimation/v1', '/get-result-by-lineuser', array(
        'methods' => 'GET',
        'callback' => 'salary_api_get_result_by_lineuser',
        'permission_callback' => '__return_true',
    ));

    // PENDING結果をlineUserIdにリンク
    register_rest_route('salary-estimation/v1', '/claim-pending-result', array(
        'methods' => 'POST',
        'callback' => 'salary_api_claim_pending_result',
        'permission_callback' => '__return_true',
    ));

    // 配布タグ付きユーザーの一覧（管理者のみ）
    register_rest_route('salary-estimation/v1', '/list-tagged', array(
        'methods' => 'GET',
        'callback' => 'salary_api_list_tagged',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        },
    ));

    // 全ユーザー一覧（管理者のみ）
    register_rest_route('salary-estimation/v1', '/list-all', array(
        'methods' => 'GET',
        'callback' => 'salary_api_list_all',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        },
    ));

    // 統計情報（管理者のみ）
    register_rest_route('salary-estimation/v1', '/stats', array(
        'methods' => 'GET',
        'callback' => 'salary_api_get_stats',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        },
    ));

    // デバッグ用：保存されているデータを確認
    register_rest_route('salary-estimation/v1', '/debug', array(
        'methods' => 'GET',
        'callback' => 'salary_api_debug',
        'permission_callback' => '__return_true',
    ));

    // デバッグログを保存
    register_rest_route('salary-estimation/v1', '/debug-log', array(
        'methods' => 'POST',
        'callback' => 'salary_api_save_debug_log',
        'permission_callback' => '__return_true',
    ));
});

/**
 * デバッグ用：保存されているデータを確認
 */
function salary_api_debug() {
    global $wpdb;
    
    // PENDING_LATEST
    $pending = get_transient('salary_result_PENDING_LATEST');
    
    // lineuser transients
    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s LIMIT 10",
            $wpdb->esc_like('_transient_salary_result_lineuser_') . '%'
        ),
        ARRAY_A
    );
    
    // session transients
    $session_rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s LIMIT 10",
            $wpdb->esc_like('_transient_salary_result_') . '%'
        ),
        ARRAY_A
    );
    
    return new WP_REST_Response(array(
        'pending_exists' => $pending !== false,
        'pending_data' => $pending ? array_keys($pending) : null,
        'lineuser_transients' => array_column($rows, 'option_name'),
        'all_salary_transients' => array_column($session_rows, 'option_name')
    ), 200);
}

/**
 * 診断結果を保存（セッションIDベース）
 */
function salary_api_save_result($request) {
    $session_id = $request->get_header('X-Session-ID');
    
    if (empty($session_id)) {
        $session_id = 'salary_' . time() . '_' . wp_generate_password(9, false);
    }
    
    $data = $request->get_json_params();
    
    if (!$data || !isset($data['result'])) {
        return new WP_Error('invalid_data', 'Invalid data', array('status' => 400));
    }
    
    $result = $data['result'];
    
    $cache_data = array(
        'baseIncome' => isset($result['baseIncome']) ? floatval($result['baseIncome']) : 0,
        'estimated' => isset($result['estimated']) ? floatval($result['estimated']) : 0,
        'addAmount' => isset($result['addAmount']) ? floatval($result['addAmount']) : 0,
        'score' => isset($result['score']) ? intval($result['score']) : 0,
        'answers' => isset($result['answers']) ? $result['answers'] : array(),
        'additionalAnswers' => isset($data['additionalAnswers']) ? $data['additionalAnswers'] : array(),
        'distributionTag' => isset($data['distributionTag']) ? (bool)$data['distributionTag'] : false,
        'distributionTagDetails' => isset($data['distributionTagDetails']) ? $data['distributionTagDetails'] : array(),
        'timestamp' => time()
    );
    
    $transient_key = 'salary_result_' . $session_id;
    set_transient($transient_key, $cache_data, 24 * HOUR_IN_SECONDS);
    
    // PENDING_LATESTとしても保存（24時間有効）
    $pending_data = $cache_data;
    $pending_data['original_session_id'] = $session_id;
    $pending_data['pending_created_at'] = time();
    set_transient('salary_result_PENDING_LATEST', $pending_data, 24 * HOUR_IN_SECONDS);
    
    return new WP_REST_Response(array(
        'success' => true,
        'session_id' => $session_id
    ), 200);
}

/**
 * 診断結果を取得（セッションIDベース）
 */
function salary_api_get_result($request) {
    $session_id = $request->get_header('X-Session-ID');
    
    if (empty($session_id)) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'No session ID'
        ), 404);
    }
    
    $transient_key = 'salary_result_' . $session_id;
    $cache_data = get_transient($transient_key);
    
    if ($cache_data === false) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'No result found'
        ), 404);
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'result' => $cache_data
    ), 200);
}

/**
 * 診断結果を保存（lineUserIdベース）
 */
function salary_api_save_result_by_lineuser($request) {
    $data = $request->get_json_params();
    
    if (!$data || !isset($data['lineUserId']) || !isset($data['result'])) {
        return new WP_Error('invalid_data', 'Invalid data: lineUserId and result are required', array('status' => 400));
    }
    
    $line_user_id = sanitize_text_field($data['lineUserId']);
    $result = $data['result'];
    
    $cache_data = array(
        'baseIncome' => isset($result['baseIncome']) ? floatval($result['baseIncome']) : 0,
        'estimated' => isset($result['estimated']) ? floatval($result['estimated']) : 0,
        'addAmount' => isset($result['addAmount']) ? floatval($result['addAmount']) : 0,
        'score' => isset($result['score']) ? intval($result['score']) : 0,
        'answers' => isset($result['answers']) ? $result['answers'] : array(),
        'additionalAnswers' => isset($data['additionalAnswers']) ? $data['additionalAnswers'] : array(),
        'distributionTag' => isset($data['distributionTag']) ? (bool)$data['distributionTag'] : false,
        'distributionTagDetails' => isset($data['distributionTagDetails']) ? $data['distributionTagDetails'] : array(),
        'lineDisplayName' => isset($data['lineDisplayName']) ? sanitize_text_field($data['lineDisplayName']) : '',
        'sessionId' => isset($data['sessionId']) ? sanitize_text_field($data['sessionId']) : '',
        'timestamp' => time()
    );
    
    $transient_key = 'salary_result_lineuser_' . $line_user_id;
    set_transient($transient_key, $cache_data, 24 * HOUR_IN_SECONDS);
    
    return new WP_REST_Response(array(
        'success' => true,
        'lineUserId' => $line_user_id
    ), 200);
}

/**
 * 診断結果を取得（lineUserIdベース）
 */
function salary_api_get_result_by_lineuser($request) {
    $line_user_id = $request->get_param('lineUserId');
    
    if (empty($line_user_id)) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'No lineUserId provided'
        ), 400);
    }
    
    $line_user_id = sanitize_text_field($line_user_id);
    
    $transient_key = 'salary_result_lineuser_' . $line_user_id;
    $cache_data = get_transient($transient_key);
    
    if ($cache_data === false) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'No result found'
        ), 404);
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'result' => $cache_data
    ), 200);
}

/**
 * PENDING結果をlineUserIdにリンク
 */
function salary_api_claim_pending_result($request) {
    $data = $request->get_json_params();
    
    if (!$data || !isset($data['lineUserId'])) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'lineUserId is required'
        ), 400);
    }
    
    $line_user_id = sanitize_text_field($data['lineUserId']);
    $line_display_name = isset($data['lineDisplayName']) ? sanitize_text_field($data['lineDisplayName']) : '';
    
    $pending_data = get_transient('salary_result_PENDING_LATEST');
    
    if ($pending_data === false) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'No pending result found'
        ), 404);
    }
    
    $created_at = isset($pending_data['pending_created_at']) ? $pending_data['pending_created_at'] : 0;
    if (time() - $created_at > 86400) {
        delete_transient('salary_result_PENDING_LATEST');
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'Pending result expired'
        ), 404);
    }
    
    $cache_data = $pending_data;
    $cache_data['lineDisplayName'] = $line_display_name;
    $cache_data['timestamp'] = time();
    unset($cache_data['pending_created_at']);
    
    $transient_key = 'salary_result_lineuser_' . $line_user_id;
    set_transient($transient_key, $cache_data, 24 * HOUR_IN_SECONDS);
    
    delete_transient('salary_result_PENDING_LATEST');
    
    return new WP_REST_Response(array(
        'success' => true,
        'lineUserId' => $line_user_id,
        'result' => $cache_data
    ), 200);
}

/**
 * additionalAnswersから値を抽出するヘルパー関数
 */
function salary_api_extract_value($field, $question_type = '') {
    if (empty($field)) {
        return '';
    }
    if (!is_array($field)) {
        return strval($field);
    }
    if (isset($field['value'])) {
        return strval($field['value']);
    }
    
    // 年齢の場合
    if ($question_type === 'age' && isset($field['minAge']) && isset($field['maxAge'])) {
        $min = intval($field['minAge']);
        $max = intval($field['maxAge']);
        if ($max >= 100) {
            return $min . '歳以上';
        }
        return $min . '-' . $max . '歳';
    }
    
    // 住まいの場合
    if (isset($field['prefecture'])) {
        return strval($field['prefecture']);
    }
    
    // 転職時期の場合
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
    
    // 転職回数の場合
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
 * タイムスタンプを正規化
 */
function salary_api_normalize_timestamp($timestamp) {
    if (empty($timestamp)) {
        return 0;
    }
    $ts = intval($timestamp);
    if ($ts > 10000000000) {
        $ts = intval($ts / 1000);
    }
    return $ts;
}

/**
 * ユーザーデータを整形
 */
function salary_api_format_user_data($line_user_id, $data) {
    $additional = isset($data['additionalAnswers']) ? $data['additionalAnswers'] : array();
    
    return array(
        'lineUserId' => $line_user_id,
        'lineDisplayName' => isset($data['lineDisplayName']) ? $data['lineDisplayName'] : '',
        'sessionId' => isset($data['sessionId']) ? $data['sessionId'] : '',
        'baseIncome' => isset($data['baseIncome']) ? $data['baseIncome'] : 0,
        'estimated' => isset($data['estimated']) ? $data['estimated'] : 0,
        'addAmount' => isset($data['addAmount']) ? $data['addAmount'] : 0,
        'score' => isset($data['score']) ? $data['score'] : 0,
        'age' => salary_api_extract_value(isset($additional['age']) ? $additional['age'] : '', 'age'),
        'location' => salary_api_extract_value(isset($additional['location']) ? $additional['location'] : '', 'location'),
        'jobChangeTiming' => salary_api_extract_value(isset($additional['jobChangeTiming']) ? $additional['jobChangeTiming'] : '', 'jobChangeTiming'),
        'jobChangeCount' => salary_api_extract_value(isset($additional['jobChangeCount']) ? $additional['jobChangeCount'] : '', 'jobChangeCount'),
        'distributionTag' => isset($data['distributionTag']) ? (bool)$data['distributionTag'] : false,
        'distributionTagDetails' => isset($data['distributionTagDetails']) ? $data['distributionTagDetails'] : array(),
        'timestamp' => salary_api_normalize_timestamp(isset($data['timestamp']) ? $data['timestamp'] : 0)
    );
}

/**
 * 配布タグ付きユーザーの一覧取得
 */
function salary_api_list_tagged() {
    global $wpdb;
    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE %s",
            $wpdb->esc_like('_transient_salary_result_lineuser_') . '%'
        ),
        ARRAY_A
    );

    $items = array();
    foreach ($rows as $row) {
        $line_user_id = str_replace('_transient_salary_result_lineuser_', '', $row['option_name']);
        $data = maybe_unserialize($row['option_value']);
        if (!is_array($data)) {
            continue;
        }
        $tag = isset($data['distributionTag']) ? (bool)$data['distributionTag'] : false;
        if ($tag) {
            $items[] = salary_api_format_user_data($line_user_id, $data);
        }
    }

    return new WP_REST_Response(array(
        'success' => true,
        'count' => count($items),
        'items' => $items
    ), 200);
}

/**
 * 全ユーザー一覧取得
 */
function salary_api_list_all() {
    global $wpdb;
    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE %s",
            $wpdb->esc_like('_transient_salary_result_lineuser_') . '%'
        ),
        ARRAY_A
    );

    $items = array();
    foreach ($rows as $row) {
        $line_user_id = str_replace('_transient_salary_result_lineuser_', '', $row['option_name']);
        $data = maybe_unserialize($row['option_value']);
        if (!is_array($data)) {
            continue;
        }
        $items[] = salary_api_format_user_data($line_user_id, $data);
    }

    return new WP_REST_Response(array(
        'success' => true,
        'count' => count($items),
        'items' => $items
    ), 200);
}

/**
 * 統計情報を取得
 */
function salary_api_get_stats() {
    global $wpdb;
    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE %s",
            $wpdb->esc_like('_transient_salary_result_lineuser_') . '%'
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
        
        if (isset($data['distributionTag']) && $data['distributionTag']) {
            $tagged++;
        }
        
        $ts = salary_api_normalize_timestamp(isset($data['timestamp']) ? $data['timestamp'] : 0);
        if ($ts >= $today_start) {
            $today++;
        }
        
        $additional = isset($data['additionalAnswers']) ? $data['additionalAnswers'] : array();
        
        $age = salary_api_extract_value(isset($additional['age']) ? $additional['age'] : '', 'age');
        if (!empty($age)) {
            $age_distribution[$age] = isset($age_distribution[$age]) ? $age_distribution[$age] + 1 : 1;
        }
        
        $loc = salary_api_extract_value(isset($additional['location']) ? $additional['location'] : '', 'location');
        if (!empty($loc)) {
            $location_distribution[$loc] = isset($location_distribution[$loc]) ? $location_distribution[$loc] + 1 : 1;
        }
        
        $timing = salary_api_extract_value(isset($additional['jobChangeTiming']) ? $additional['jobChangeTiming'] : '', 'jobChangeTiming');
        if (!empty($timing)) {
            $timing_distribution[$timing] = isset($timing_distribution[$timing]) ? $timing_distribution[$timing] + 1 : 1;
        }
        
        $jc = salary_api_extract_value(isset($additional['jobChangeCount']) ? $additional['jobChangeCount'] : '', 'jobChangeCount');
        if (!empty($jc)) {
            $job_change_distribution[$jc] = isset($job_change_distribution[$jc]) ? $job_change_distribution[$jc] + 1 : 1;
        }
        
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
        'tagDetailDistribution' => $tag_detail_distribution
    ), 200);
}

/**
 * 管理画面にダッシュボードを追加
 */
add_action('admin_menu', function() {
    add_menu_page(
        '年収診断ダッシュボード',
        '年収診断',
        'manage_options',
        'salary-dashboard',
        'salary_api_render_dashboard',
        'dashicons-chart-line',
        59
    );
    
    add_submenu_page(
        'salary-dashboard',
        'サマリー',
        'サマリー',
        'manage_options',
        'salary-dashboard',
        'salary_api_render_dashboard'
    );
    
    add_submenu_page(
        'salary-dashboard',
        'ユーザー一覧',
        'ユーザー一覧',
        'manage_options',
        'salary-users',
        'salary_api_render_users'
    );
});

/**
 * ダッシュボード画面の描画（サマリー）
 */
function salary_api_render_dashboard() {
    if (!current_user_can('manage_options')) {
        wp_die('権限がありません');
    }

    $stats = salary_api_get_stats_for_admin();
    
    ?>
    <div class="wrap">
        <h1>📊 年収診断ダッシュボード</h1>
        
        <style>
            .salary-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            .salary-stat-card {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
            }
            .salary-stat-card h2 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #666;
            }
            .salary-stat-card .number {
                font-size: 36px;
                font-weight: bold;
                color: #ff6b03;
            }
            .salary-stat-card .sub {
                font-size: 14px;
                color: #666;
            }
            .salary-distribution {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .salary-distribution h3 {
                margin-top: 0;
            }
            .salary-bar {
                display: flex;
                align-items: center;
                margin: 8px 0;
            }
            .salary-bar-label {
                width: 180px;
                font-size: 13px;
            }
            .salary-bar-container {
                flex: 1;
                height: 20px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
            }
            .salary-bar-fill {
                height: 100%;
                background: #ff6b03;
                border-radius: 4px;
            }
            .salary-bar-value {
                width: 100px;
                text-align: right;
                font-size: 13px;
                padding-left: 10px;
            }
        </style>
        
        <div class="salary-stats-grid">
            <div class="salary-stat-card">
                <h2>総診断数</h2>
                <div class="number"><?php echo esc_html($stats['total']); ?></div>
                <div class="sub">人</div>
            </div>
            <div class="salary-stat-card">
                <h2>配布タグ対象</h2>
                <div class="number"><?php echo esc_html($stats['tagged']); ?></div>
                <div class="sub"><?php echo esc_html($stats['taggedRate']); ?>%</div>
            </div>
            <div class="salary-stat-card">
                <h2>本日の診断数</h2>
                <div class="number"><?php echo esc_html($stats['today']); ?></div>
                <div class="sub">人</div>
            </div>
        </div>
        
        <div class="salary-distribution">
            <h3>📝 年齢分布</h3>
            <?php salary_api_render_bar_chart($stats['ageDistribution'], $stats['total']); ?>
        </div>
        
        <div class="salary-distribution">
            <h3>📍 住まい分布</h3>
            <?php salary_api_render_bar_chart($stats['locationDistribution'], $stats['total']); ?>
        </div>
        
        <div class="salary-distribution">
            <h3>📅 転職時期分布</h3>
            <?php salary_api_render_bar_chart($stats['timingDistribution'], $stats['total']); ?>
        </div>
        
        <div class="salary-distribution">
            <h3>🔄 転職回数分布</h3>
            <?php salary_api_render_bar_chart($stats['jobChangeDistribution'], $stats['total']); ?>
        </div>
        
        <div class="salary-distribution">
            <h3>🏷️ 配布タグ条件別（該当率）</h3>
            <?php 
            $tag_details = $stats['tagDetailDistribution'];
            $labels = array(
                'age' => '年齢（20-34歳）',
                'location' => '住まい（対象エリア）',
                'timing' => '転職時期（1年以内）',
                'jobChangeCount' => '転職回数（2回まで）'
            );
            foreach ($tag_details as $key => $vals) {
                $true_count = $vals['true'];
                $total_for_this = $vals['true'] + $vals['false'];
                $rate = $total_for_this > 0 ? round($true_count / $total_for_this * 100, 1) : 0;
                echo '<div class="salary-bar">';
                echo '<div class="salary-bar-label">' . esc_html($labels[$key]) . '</div>';
                echo '<div class="salary-bar-container"><div class="salary-bar-fill" style="width: ' . esc_attr($rate) . '%;"></div></div>';
                echo '<div class="salary-bar-value">' . esc_html($true_count) . '人 (' . esc_html($rate) . '%)</div>';
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
function salary_api_render_bar_chart($distribution, $total) {
    if (empty($distribution)) {
        echo '<p>データがありません</p>';
        return;
    }
    
    arsort($distribution);
    
    foreach ($distribution as $label => $count) {
        $rate = $total > 0 ? round($count / $total * 100, 1) : 0;
        echo '<div class="salary-bar">';
        echo '<div class="salary-bar-label">' . esc_html($label) . '</div>';
        echo '<div class="salary-bar-container"><div class="salary-bar-fill" style="width: ' . esc_attr($rate) . '%;"></div></div>';
        echo '<div class="salary-bar-value">' . esc_html($count) . '人 (' . esc_html($rate) . '%)</div>';
        echo '</div>';
    }
}

/**
 * ユーザー一覧画面の描画
 */
function salary_api_render_users() {
    if (!current_user_can('manage_options')) {
        wp_die('権限がありません');
    }

    $filter = isset($_GET['filter']) ? sanitize_text_field($_GET['filter']) : 'all';
    $items = salary_api_list_all_for_admin($filter);
    $count = count($items);

    ?>
    <div class="wrap">
        <h1>👥 ユーザー一覧（年収診断）</h1>
        
        <p>
            <a class="button <?php echo $filter === 'all' ? 'button-primary' : ''; ?>" href="<?php echo esc_url(admin_url('admin.php?page=salary-users&filter=all')); ?>">全て (<?php echo esc_html($count); ?>)</a>
            <a class="button <?php echo $filter === 'tagged' ? 'button-primary' : ''; ?>" href="<?php echo esc_url(admin_url('admin.php?page=salary-users&filter=tagged')); ?>">配布タグのみ</a>
            <a class="button button-secondary" href="<?php echo esc_url(admin_url('admin-post.php?action=salary_export_csv&filter=' . $filter)); ?>">📥 CSVダウンロード</a>
        </p>
        
        <table class="widefat fixed striped">
            <thead>
                <tr>
                    <th style="width: 150px;">LINE ID</th>
                    <th style="width: 100px;">LINE名</th>
                    <th style="width: 80px;">年齢</th>
                    <th style="width: 80px;">住まい</th>
                    <th style="width: 100px;">転職時期</th>
                    <th style="width: 110px;">転職回数</th>
                    <th style="width: 50px;">配布</th>
                    <th style="width: 130px;">登録日時</th>
                </tr>
            </thead>
            <tbody>
                <?php if ($count === 0): ?>
                    <tr><td colspan="8">データがありません。</td></tr>
                <?php else: ?>
                    <?php foreach ($items as $row): ?>
                        <tr>
                            <td style="font-size: 10px; font-family: monospace;"><?php echo esc_html($row['lineUserId'] ?: '-'); ?></td>
                            <td><?php echo esc_html($row['lineDisplayName'] ?: '(未取得)'); ?></td>
                            <td><?php echo esc_html($row['age'] ?: '-'); ?></td>
                            <td><?php echo esc_html($row['location'] ?: '-'); ?></td>
                            <td><?php echo esc_html($row['jobChangeTiming'] ?: '-'); ?></td>
                            <td><?php echo esc_html($row['jobChangeCount'] ?: '-'); ?></td>
                            <td><?php echo $row['distributionTag'] ? '✅' : '—'; ?></td>
                            <td><?php echo !empty($row['timestamp']) ? esc_html(date_i18n('Y-m-d H:i', $row['timestamp'])) : '-'; ?></td>
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
function salary_api_get_stats_for_admin() {
    $response = salary_api_get_stats();
    return $response->get_data();
}

/**
 * 管理画面用：全ユーザーの配列を取得
 */
function salary_api_list_all_for_admin($filter = 'all') {
    global $wpdb;
    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE %s",
            $wpdb->esc_like('_transient_salary_result_lineuser_') . '%'
        ),
        ARRAY_A
    );

    $items = array();
    foreach ($rows as $row) {
        $line_user_id = str_replace('_transient_salary_result_lineuser_', '', $row['option_name']);
        $data = maybe_unserialize($row['option_value']);
        if (!is_array($data)) {
            continue;
        }
        
        $tag = isset($data['distributionTag']) ? (bool)$data['distributionTag'] : false;
        
        if ($filter === 'tagged' && !$tag) {
            continue;
        }
        
        $items[] = salary_api_format_user_data($line_user_id, $data);
    }
    
    usort($items, function($a, $b) {
        return intval($b['timestamp']) - intval($a['timestamp']);
    });
    
    return $items;
}

/**
 * CSVダウンロード
 */
add_action('admin_post_salary_export_csv', function() {
    if (!current_user_can('manage_options')) {
        wp_die('権限がありません');
    }
    
    $filter = isset($_GET['filter']) ? sanitize_text_field($_GET['filter']) : 'all';
    $items = salary_api_list_all_for_admin($filter);

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename=salary_estimation_results_' . date('Ymd_His') . '.csv');

    $output = fopen('php://output', 'w');
    fwrite($output, "\xEF\xBB\xBF");
    
    fputcsv($output, array(
        'LINE User ID',
        'LINE表示名',
        '年齢',
        '住まい',
        '転職時期',
        '転職回数',
        '配布タグ',
        '登録日時'
    ));
    
    foreach ($items as $row) {
        fputcsv($output, array(
            $row['lineUserId'],
            $row['lineDisplayName'],
            $row['age'],
            $row['location'],
            $row['jobChangeTiming'],
            $row['jobChangeCount'],
            $row['distributionTag'] ? 'はい' : 'いいえ',
            !empty($row['timestamp']) ? date_i18n('Y-m-d H:i:s', $row['timestamp']) : ''
        ));
    }
    fclose($output);
    exit;
});

