<?php
/**
 * Plugin Name: 年収診断（転職エージェント連携版）
 * Description: SWELL 環境向けの年収診断結果パーツ。ショートコード [salary_diagnosis_result] で結果カード＋おすすめエージェントを表示します。
 * Version: 0.1.0
 * Author: ミギナナメウエ
 */

if (!defined('ABSPATH')) {
    exit;
}

class Salary_Diagnosis_Plugin {
    const VERSION = '0.1.0';

    const OPTION_CONSULTATION_URL = 'salary_diagnosis_consultation_url';

    public static function init() {
        add_shortcode('salary_diagnosis_result', [__CLASS__, 'render_result']);
        add_action('wp_enqueue_scripts', [__CLASS__, 'enqueue_assets']);
        add_action('admin_menu', [__CLASS__, 'register_admin_page']);
        add_action('admin_init', [__CLASS__, 'save_consultation_url']);
    }

    /**
     * 管理画面で「無料相談リンクURL」を保存
     */
    public static function save_consultation_url() {
        if (!current_user_can('manage_options')) {
            return;
        }
        if (empty($_POST['salary_diagnosis_consultation_nonce']) || !wp_verify_nonce($_POST['salary_diagnosis_consultation_nonce'], 'salary_diagnosis_consultation')) {
            return;
        }
        if (isset($_POST['consultation_url'])) {
            $url = esc_url_raw(wp_unslash($_POST['consultation_url']));
            update_option(self::OPTION_CONSULTATION_URL, $url);
            wp_safe_redirect(admin_url('admin.php?page=salary-diagnosis-dashboard&settings-updated=consult'));
            exit;
        }
    }

    public static function enqueue_assets() {
        // 結果ページ用のスタイルを 1 ファイルにまとめる場合はここで登録・読み込み
        wp_register_style(
            'salary-diagnosis-result',
            plugins_url('assets/result.css', __FILE__),
            [],
            self::VERSION
        );
    }

    public static function render_result($atts = [], $content = '') {
        if (wp_script_is('salary-diagnosis-result', 'registered')) {
            wp_enqueue_style('salary-diagnosis-result');
        }

        ob_start();
        include __DIR__ . '/templates/result-page.php';
        return ob_get_clean();
    }

    /**
     * 管理ダッシュボード（URL・ショートコード確認用）
     */
    public static function register_admin_page() {
        add_menu_page(
            '年収診断ダッシュボード',
            '年収診断',
            'manage_options',
            'salary-diagnosis-dashboard',
            [__CLASS__, 'render_admin_page'],
            'dashicons-chart-line',
            81
        );
    }

    public static function render_admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $plugin_url  = plugin_dir_url(__FILE__);
        $assets_url  = esc_html($plugin_url . 'assets/');
        $shortcode   = '[salary_diagnosis_result]';
        $consult_url = get_option(self::OPTION_CONSULTATION_URL, '');

        // job-site-diagnosis プラグイン連携状況チェック
        $has_job_plugin = class_exists('Job_Site_Diagnosis') || function_exists('job_site_diagnosis_init');
        $job_status     = $has_job_plugin ? '有効（エージェントデータと連携可能）' : '未検出（転職エージェント診断プラグインを有効化してください）';

        if (isset($_GET['settings-updated']) && $_GET['settings-updated'] === 'consult') {
            echo '<div class="notice notice-success is-dismissible"><p>無料相談リンクを保存しました。</p></div>';
        }

        ?>
        <div class="wrap">
            <h1>年収診断ダッシュボード</h1>
            <p>このページでは、年収診断プラグインのショートコードや、転職エージェント診断プラグインとの連携状況を確認できます。</p>

            <h2>キャリアアドバイザー無料相談リンク</h2>
            <form method="post" action="">
                <?php wp_nonce_field('salary_diagnosis_consultation', 'salary_diagnosis_consultation_nonce'); ?>
                <table class="form-table" style="max-width: 720px;">
                    <tr>
                        <th scope="row"><label for="consultation_url">無料相談リンク URL</label></th>
                        <td>
                            <input type="url" name="consultation_url" id="consultation_url" value="<?php echo esc_attr($consult_url); ?>" class="regular-text" placeholder="https://example.com/consult/">
                            <p class="description">結果ページの「キャリアアドバイザーに無料相談する」ボタンのリンク先です。未入力の場合はボタンは表示されません。</p>
                        </td>
                    </tr>
                </table>
                <p class="submit">
                    <button type="submit" class="button button-primary">保存する</button>
                </p>
            </form>
            <p style="margin-bottom: 24px;"></p>

            <h2>ショートコード</h2>
            <table class="widefat striped" style="max-width: 720px;">
                <tbody>
                <tr>
                    <th scope="row">結果ページ用ショートコード</th>
                    <td>
                        <code><?php echo esc_html($shortcode); ?></code>
                        <p class="description">SWELL の固定ページやブログパーツ内でこのショートコードを挿入すると、結果カード＋年収偏差値＋AI アドバイス＋おすすめエージェントが表示されます。</p>
                    </td>
                </tr>
                </tbody>
            </table>

            <h2 style="margin-top: 24px;">アセット URL</h2>
            <table class="widefat striped" style="max-width: 720px;">
                <tbody>
                <tr>
                    <th scope="row">プラグイン URL</th>
                    <td><code><?php echo esc_html($plugin_url); ?></code></td>
                </tr>
                <tr>
                    <th scope="row">画像ディレクトリ</th>
                    <td><code><?php echo $assets_url; ?></code></td>
                </tr>
                </tbody>
            </table>

            <h2 style="margin-top: 24px;">転職エージェント診断プラグインとの連携</h2>
            <table class="widefat striped" style="max-width: 720px;">
                <tbody>
                <tr>
                    <th scope="row">連携ステータス</th>
                    <td><?php echo esc_html($job_status); ?></td>
                </tr>
                <tr>
                    <th scope="row">エージェントデータの出どころ</th>
                    <td>
                        <p class="description">
                            job-site-diagnosis プラグインが有効な場合、管理画面で登録したエージェント一覧（職種・エリア・年収レンジなど）をもとに、<br>
                            「あなたにおすすめの転職エージェント」カードの内容が自動的に生成されます。
                        </p>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
        <?php
    }
}

Salary_Diagnosis_Plugin::init();
