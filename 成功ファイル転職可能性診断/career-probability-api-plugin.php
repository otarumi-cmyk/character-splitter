<?php
/**
 * Plugin Name: Career Probability Diagnosis API
 * Description: 転職可能性診断の結果保存・取得API + ダッシュボード
 * Version: 1.0.0
 * Author: Custom
 */

if (!defined('ABSPATH')) exit;

// ========================================
// REST API エンドポイント登録
// ========================================
add_action('rest_api_init', function() {
    $namespace = 'career-probability/v1';
    
    // 結果保存（セッションID）
    register_rest_route($namespace, '/save-result', array(
        'methods' => 'POST',
        'callback' => 'career_prob_save_result',
        'permission_callback' => '__return_true'
    ));
    
    // 結果取得（セッションID）
    register_rest_route($namespace, '/get-result', array(
        'methods' => 'GET',
        'callback' => 'career_prob_get_result',
        'permission_callback' => '__return_true'
    ));
    
    // 結果保存（LINE User ID）
    register_rest_route($namespace, '/save-result-by-lineuser', array(
        'methods' => 'POST',
        'callback' => 'career_prob_save_result_by_lineuser',
        'permission_callback' => '__return_true'
    ));
    
    // 結果取得（LINE User ID）
    register_rest_route($namespace, '/get-result-by-lineuser', array(
        'methods' => 'GET',
        'callback' => 'career_prob_get_result_by_lineuser',
        'permission_callback' => '__return_true'
    ));
    
    // PENDING結果をLINEユーザーにリンク
    register_rest_route($namespace, '/claim-pending-result', array(
        'methods' => 'POST',
        'callback' => 'career_prob_claim_pending_result',
        'permission_callback' => '__return_true'
    ));
    
    // デバッグ用
    register_rest_route($namespace, '/debug', array(
        'methods' => 'GET',
        'callback' => 'career_prob_debug',
        'permission_callback' => '__return_true'
    ));
});

// ========================================
// CORSヘッダー
// ========================================
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Session-ID');
        header('Access-Control-Allow-Credentials: true');
        return $value;
    });
}, 15);

// ========================================
// API実装
// ========================================
function career_prob_save_result($request) {
    $session_id = $request->get_header('X-Session-ID');
    if (empty($session_id)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Session ID required'), 400);
    }
    
    $body = $request->get_json_params();
    $result = isset($body['result']) ? $body['result'] : null;
    $additional_answers = isset($body['additionalAnswers']) ? $body['additionalAnswers'] : array();
    $distribution_tag = isset($body['distributionTag']) ? $body['distributionTag'] : false;
    $distribution_tag_details = isset($body['distributionTagDetails']) ? $body['distributionTagDetails'] : array();
    
    if (empty($result)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Result data required'), 400);
    }
    
    $cache_data = array(
        'scores' => isset($result['scores']) ? $result['scores'] : null,
        'results' => isset($result['results']) ? $result['results'] : null,
        'answers' => isset($result['answers']) ? $result['answers'] : null,
        'additionalAnswers' => $additional_answers,
        'distributionTag' => $distribution_tag,
        'distributionTagDetails' => $distribution_tag_details,
        'timestamp' => time(),
        'original_session_id' => $session_id
    );
    
    set_transient('career_result_' . $session_id, $cache_data, 24 * HOUR_IN_SECONDS);
    set_transient('career_result_PENDING_LATEST', $cache_data, 24 * HOUR_IN_SECONDS);
    
    return new WP_REST_Response(array('success' => true, 'session_id' => $session_id), 200);
}

function career_prob_get_result($request) {
    $session_id = $request->get_header('X-Session-ID');
    if (empty($session_id)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Session ID required'), 400);
    }
    
    $cache_data = get_transient('career_result_' . $session_id);
    
    if ($cache_data === false) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Result not found'), 404);
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'result' => $cache_data
    ), 200);
}

function career_prob_save_result_by_lineuser($request) {
    $body = $request->get_json_params();
    $line_user_id = isset($body['lineUserId']) ? sanitize_text_field($body['lineUserId']) : '';
    $line_display_name = isset($body['lineDisplayName']) ? sanitize_text_field($body['lineDisplayName']) : '';
    $result = isset($body['result']) ? $body['result'] : null;
    $additional_answers = isset($body['additionalAnswers']) ? $body['additionalAnswers'] : array();
    $distribution_tag = isset($body['distributionTag']) ? $body['distributionTag'] : false;
    $distribution_tag_details = isset($body['distributionTagDetails']) ? $body['distributionTagDetails'] : array();
    $session_id = isset($body['sessionId']) ? sanitize_text_field($body['sessionId']) : '';
    
    if (empty($line_user_id)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'LINE User ID required'), 400);
    }
    
    if (empty($result)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Result data required'), 400);
    }
    
    $cache_data = array(
        'lineUserId' => $line_user_id,
        'lineDisplayName' => $line_display_name,
        'scores' => isset($result['scores']) ? $result['scores'] : null,
        'results' => isset($result['results']) ? $result['results'] : null,
        'answers' => isset($result['answers']) ? $result['answers'] : null,
        'additionalAnswers' => $additional_answers,
        'distributionTag' => $distribution_tag,
        'distributionTagDetails' => $distribution_tag_details,
        'timestamp' => time(),
        'session_id' => $session_id,
        'created_at' => current_time('mysql')
    );
    
    set_transient('career_lineuser_' . $line_user_id, $cache_data, 365 * DAY_IN_SECONDS);
    
    return new WP_REST_Response(array('success' => true, 'lineUserId' => $line_user_id), 200);
}

function career_prob_get_result_by_lineuser($request) {
    $line_user_id = $request->get_param('lineUserId');
    
    if (empty($line_user_id)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'LINE User ID required'), 400);
    }
    
    $cache_data = get_transient('career_lineuser_' . $line_user_id);
    
    if ($cache_data === false) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Result not found'), 404);
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'result' => $cache_data
    ), 200);
}

function career_prob_claim_pending_result($request) {
    $body = $request->get_json_params();
    $line_user_id = isset($body['lineUserId']) ? sanitize_text_field($body['lineUserId']) : '';
    $line_display_name = isset($body['lineDisplayName']) ? sanitize_text_field($body['lineDisplayName']) : '';
    
    if (empty($line_user_id)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'LINE User ID required'), 400);
    }
    
    $pending_data = get_transient('career_result_PENDING_LATEST');
    
    if ($pending_data === false) {
        return new WP_REST_Response(array('success' => false, 'message' => 'No pending result found'), 404);
    }
    
    $pending_data['lineUserId'] = $line_user_id;
    $pending_data['lineDisplayName'] = $line_display_name;
    $pending_data['pending_created_at'] = current_time('mysql');
    
    set_transient('career_lineuser_' . $line_user_id, $pending_data, 365 * DAY_IN_SECONDS);
    delete_transient('career_result_PENDING_LATEST');
    
    return new WP_REST_Response(array(
        'success' => true,
        'result' => $pending_data,
        'lineUserId' => $line_user_id
    ), 200);
}

function career_prob_debug($request) {
    global $wpdb;
    
    $pending_data = get_transient('career_result_PENDING_LATEST');
    $all_transients = $wpdb->get_col(
        "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE '_transient_career_%' LIMIT 100"
    );
    
    $lineuser_transients = array_filter($all_transients, function($name) {
        return strpos($name, '_transient_career_lineuser_') !== false;
    });
    
    return new WP_REST_Response(array(
        'pending_exists' => $pending_data !== false,
        'pending_data' => $pending_data !== false ? array_keys($pending_data) : null,
        'lineuser_transients' => array_values($lineuser_transients),
        'all_career_transients' => $all_transients
    ), 200);
}

// ========================================
// 管理画面ダッシュボード
// ========================================
add_action('admin_menu', function() {
    add_menu_page(
        '転職可能性診断',
        '転職可能性診断',
        'manage_options',
        'career-probability-dashboard',
        'career_prob_dashboard_page',
        'dashicons-chart-bar',
        30
    );
    
    add_submenu_page(
        'career-probability-dashboard',
        'サマリー',
        'サマリー',
        'manage_options',
        'career-probability-dashboard',
        'career_prob_dashboard_page'
    );
    
    add_submenu_page(
        'career-probability-dashboard',
        'ユーザー一覧',
        'ユーザー一覧',
        'manage_options',
        'career-probability-users',
        'career_prob_users_page'
    );
});

function career_prob_get_all_users() {
    global $wpdb;
    
    $transients = $wpdb->get_results(
        "SELECT option_name, option_value FROM {$wpdb->options} 
         WHERE option_name LIKE '_transient_career_lineuser_%' 
         ORDER BY option_id DESC LIMIT 1000"
    );
    
    $users = array();
    foreach ($transients as $transient) {
        $data = maybe_unserialize($transient->option_value);
        if ($data && is_array($data)) {
            $users[] = $data;
        }
    }
    
    return $users;
}

function career_prob_format_user_data($data) {
    $additional = isset($data['additionalAnswers']) ? $data['additionalAnswers'] : array();
    
    return array(
        'line_user_id' => isset($data['lineUserId']) ? $data['lineUserId'] : '-',
        'line_display_name' => isset($data['lineDisplayName']) ? $data['lineDisplayName'] : '-',
        'age' => isset($additional['age']['value']) ? $additional['age']['value'] : '-',
        'location' => isset($additional['location']['value']) ? $additional['location']['value'] : '-',
        'job_change_timing' => isset($additional['jobChangeTiming']['value']) ? $additional['jobChangeTiming']['value'] : '-',
        'job_change_count' => isset($additional['jobChangeCount']['value']) ? $additional['jobChangeCount']['value'] : '-',
        'distribution_tag' => isset($data['distributionTag']) && $data['distributionTag'] ? '○' : '×',
        'created_at' => isset($data['created_at']) ? $data['created_at'] : (isset($data['pending_created_at']) ? $data['pending_created_at'] : '-')
    );
}

function career_prob_dashboard_page() {
    $users = career_prob_get_all_users();
    
    $total = count($users);
    $tagged = 0;
    $age_dist = array();
    $location_dist = array();
    $timing_dist = array();
    $count_dist = array();
    
    foreach ($users as $user) {
        if (isset($user['distributionTag']) && $user['distributionTag']) {
            $tagged++;
        }
        
        $formatted = career_prob_format_user_data($user);
        
        if ($formatted['age'] !== '-') {
            $age_dist[$formatted['age']] = ($age_dist[$formatted['age']] ?? 0) + 1;
        }
        if ($formatted['location'] !== '-') {
            $location_dist[$formatted['location']] = ($location_dist[$formatted['location']] ?? 0) + 1;
        }
        if ($formatted['job_change_timing'] !== '-') {
            $timing_dist[$formatted['job_change_timing']] = ($timing_dist[$formatted['job_change_timing']] ?? 0) + 1;
        }
        if ($formatted['job_change_count'] !== '-') {
            $count_dist[$formatted['job_change_count']] = ($count_dist[$formatted['job_change_count']] ?? 0) + 1;
        }
    }
    
    ?>
    <div class="wrap">
        <h1>転職可能性診断 - サマリー</h1>
        
        <div style="display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap;">
            <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-width: 200px;">
                <h3 style="margin: 0 0 10px; color: #666;">診断総数</h3>
                <div style="font-size: 36px; font-weight: bold; color: #2271b1;"><?php echo $total; ?></div>
            </div>
            <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-width: 200px;">
                <h3 style="margin: 0 0 10px; color: #666;">配布タグ対象</h3>
                <div style="font-size: 36px; font-weight: bold; color: #00a32a;"><?php echo $tagged; ?></div>
            </div>
            <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-width: 200px;">
                <h3 style="margin: 0 0 10px; color: #666;">配布率</h3>
                <div style="font-size: 36px; font-weight: bold; color: #dba617;">
                    <?php echo $total > 0 ? round(($tagged / $total) * 100, 1) : 0; ?>%
                </div>
            </div>
        </div>
        
        <h2>回答分布</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3>年齢</h3>
                <table class="widefat">
                    <thead><tr><th>年齢</th><th>人数</th></tr></thead>
                    <tbody>
                    <?php foreach ($age_dist as $age => $count): ?>
                        <tr><td><?php echo esc_html($age); ?></td><td><?php echo $count; ?></td></tr>
                    <?php endforeach; ?>
                    <?php if (empty($age_dist)): ?>
                        <tr><td colspan="2">データなし</td></tr>
                    <?php endif; ?>
                    </tbody>
                </table>
            </div>
            
            <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3>住まい</h3>
                <table class="widefat">
                    <thead><tr><th>都道府県</th><th>人数</th></tr></thead>
                    <tbody>
                    <?php foreach ($location_dist as $loc => $count): ?>
                        <tr><td><?php echo esc_html($loc); ?></td><td><?php echo $count; ?></td></tr>
                    <?php endforeach; ?>
                    <?php if (empty($location_dist)): ?>
                        <tr><td colspan="2">データなし</td></tr>
                    <?php endif; ?>
                    </tbody>
                </table>
            </div>
            
            <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3>転職時期</h3>
                <table class="widefat">
                    <thead><tr><th>時期</th><th>人数</th></tr></thead>
                    <tbody>
                    <?php foreach ($timing_dist as $timing => $count): ?>
                        <tr><td><?php echo esc_html($timing); ?></td><td><?php echo $count; ?></td></tr>
                    <?php endforeach; ?>
                    <?php if (empty($timing_dist)): ?>
                        <tr><td colspan="2">データなし</td></tr>
                    <?php endif; ?>
                    </tbody>
                </table>
            </div>
            
            <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3>転職回数</h3>
                <table class="widefat">
                    <thead><tr><th>回数</th><th>人数</th></tr></thead>
                    <tbody>
                    <?php foreach ($count_dist as $cnt => $num): ?>
                        <tr><td><?php echo esc_html($cnt); ?></td><td><?php echo $num; ?></td></tr>
                    <?php endforeach; ?>
                    <?php if (empty($count_dist)): ?>
                        <tr><td colspan="2">データなし</td></tr>
                    <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <?php
}

function career_prob_users_page() {
    // CSV出力処理
    if (isset($_GET['export']) && $_GET['export'] === 'csv') {
        career_prob_export_csv();
        exit;
    }
    
    $users = career_prob_get_all_users();
    $filter = isset($_GET['filter']) ? $_GET['filter'] : 'all';
    
    if ($filter === 'tagged') {
        $users = array_filter($users, function($u) {
            return isset($u['distributionTag']) && $u['distributionTag'];
        });
    }
    
    ?>
    <div class="wrap">
        <h1>転職可能性診断 - ユーザー一覧</h1>
        
        <div style="margin: 20px 0;">
            <a href="?page=career-probability-users&filter=all" class="button <?php echo $filter === 'all' ? 'button-primary' : ''; ?>">すべて</a>
            <a href="?page=career-probability-users&filter=tagged" class="button <?php echo $filter === 'tagged' ? 'button-primary' : ''; ?>">配布対象のみ</a>
            <a href="?page=career-probability-users&export=csv&filter=<?php echo $filter; ?>" class="button" style="margin-left: 20px;">CSVエクスポート</a>
        </div>
        
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th style="width: 180px;">LINE User ID</th>
                    <th style="width: 120px;">LINE名</th>
                    <th style="width: 100px;">年齢</th>
                    <th style="width: 100px;">住まい</th>
                    <th style="width: 120px;">転職時期</th>
                    <th style="width: 150px;">転職回数</th>
                    <th style="width: 60px;">配布</th>
                    <th style="width: 150px;">登録日時</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($users as $user): 
                    $formatted = career_prob_format_user_data($user);
                ?>
                <tr>
                    <td><code style="font-size: 11px;"><?php echo esc_html(substr($formatted['line_user_id'], 0, 20)) . '...'; ?></code></td>
                    <td><?php echo esc_html($formatted['line_display_name']); ?></td>
                    <td><?php echo esc_html($formatted['age']); ?></td>
                    <td><?php echo esc_html($formatted['location']); ?></td>
                    <td><?php echo esc_html($formatted['job_change_timing']); ?></td>
                    <td><?php echo esc_html($formatted['job_change_count']); ?></td>
                    <td style="color: <?php echo $formatted['distribution_tag'] === '○' ? '#00a32a' : '#d63638'; ?>; font-weight: bold;">
                        <?php echo $formatted['distribution_tag']; ?>
                    </td>
                    <td><?php echo esc_html($formatted['created_at']); ?></td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($users)): ?>
                <tr><td colspan="8">データがありません</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php
}

function career_prob_export_csv() {
    $users = career_prob_get_all_users();
    $filter = isset($_GET['filter']) ? $_GET['filter'] : 'all';
    
    if ($filter === 'tagged') {
        $users = array_filter($users, function($u) {
            return isset($u['distributionTag']) && $u['distributionTag'];
        });
    }
    
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="career-probability-users-' . date('Y-m-d') . '.csv"');
    
    echo "\xEF\xBB\xBF"; // BOM for Excel
    
    $output = fopen('php://output', 'w');
    
    fputcsv($output, array(
        'LINE User ID',
        'LINE名',
        '年齢',
        '住まい',
        '転職時期',
        '転職回数',
        '配布対象',
        '登録日時'
    ));
    
    foreach ($users as $user) {
        $formatted = career_prob_format_user_data($user);
        fputcsv($output, array(
            $formatted['line_user_id'],
            $formatted['line_display_name'],
            $formatted['age'],
            $formatted['location'],
            $formatted['job_change_timing'],
            $formatted['job_change_count'],
            $formatted['distribution_tag'],
            $formatted['created_at']
        ));
    }
    
    fclose($output);
}

