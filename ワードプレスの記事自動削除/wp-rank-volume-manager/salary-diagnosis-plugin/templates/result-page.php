<?php
/**
 * 年収診断の結果ページテンプレート（SWELL 用）
 *
 * - テーマ側のコンテンツ領域内で呼び出される想定のため、<html> や <body> は含めない
 * - 画像パスは plugins_url() でプラグイン相対に解決
 * - おすすめエージェント部分は job-site-diagnosis プラグインのグローバル変数を利用
 */

$plugin_url = plugin_dir_url(dirname(__FILE__));
$assets_url = $plugin_url . 'assets/';
?>
<div class="page-wrap salary-diagnosis-result-wrap">
  <section class="card">
    <div class="card-head card-head-main">診断結果</div>
    <div class="card-body">
      <p class="result-main-label">あなたの適正年収</p>
      <div class="result-value-row">
        <span class="result-value-main" id="salaryResult">8,000,000</span><span class="result-value-unit">円</span>
      </div>
      <p class="result-note">
        ここでは、これまでのご経験や現在の条件をもとに、建設・施工管理領域のデータベースから近い条件の方の年収を集計し、「いま狙える水準」の目安を表示しています。
      </p>
    </div>
  </section>

  <section class="card">
    <div class="card-head">同じ条件の年収分布</div>
    <div class="card-body">
      <p class="dev-main-label">あなたの年収偏差値</p>
      <div class="dev-main-row">
        <span class="dev-main-value" id="devMainScore">--</span>
      </div>
      <p class="dev-sub-note" id="devSubNote">
        あなたと同じ年齢帯の人たちと比べたときの、おおよその位置です。
      </p>
      <div class="dev-bar-wrap">
        <div class="dev-bar-track">
          <div class="dev-bar-fill" id="devBarFill"></div>
          <div class="dev-bar-pointer" id="devBarPointer"></div>
        </div>
        <div class="dev-bar-scale">
          <span>低い</span>
          <span>平均</span>
          <span>高い</span>
        </div>
      </div>
      <p class="dist-caption">
        縦軸：人数の多さ（このグラフ内で最大を100％とした相対値）／ 横軸：年収レンジ
      </p>
      <div class="dist-chart" id="devHistChart">
        <div class="dist-ygrid-line dist-ygrid-10"><span>3%</span></div>
        <div class="dist-ygrid-line dist-ygrid-20"><span>6%</span></div>
        <div class="dist-ygrid-line dist-ygrid-30"><span>9%</span></div>
        <?php for ($i = 0; $i < 10; $i++) : ?>
          <div class="dist-bar"></div>
        <?php endfor; ?>
      </div>
      <div class="dist-xlabels">
        <span>〜100万</span>
        <span>100〜200万</span>
        <span>200〜300万</span>
        <span>300〜400万</span>
        <span>400〜500万</span>
        <span>500〜600万</span>
        <span>600〜700万</span>
        <span>700〜800万</span>
        <span>800〜900万</span>
        <span>900万〜</span>
      </div>
      <p class="dist-legend" id="devLegend">
        ※統計データをもとにした概算であり、実際の年収分布とは異なる場合があります。
      </p>
    </div>
  </section>

  <section class="card">
    <div class="card-head">AIキャリアアドバイザーからのアドバイス</div>
    <div class="card-body">
      <div style="margin-bottom: 12px;">
        <img src="<?php echo esc_url($assets_url . 'advisor-header.png'); ?>" alt="キャリアアドバイザーからのあなたへの転職アドバイス" style="width:100%;height:auto;display:block;border-radius:4px;">
      </div>
      <div class="advice-header">
        <div class="advice-icon">💡</div>
        <div>
          <div class="advice-title">適正年収に近づくために、いまできる3つのアクション</div>
        </div>
      </div>
      <ul class="advice-list" id="adviceList"></ul>
      <?php
      $consultation_url = get_option(Salary_Diagnosis_Plugin::OPTION_CONSULTATION_URL, '');
      if ($consultation_url !== '') :
      ?>
      <p style="margin-top: 1rem;">
        <a href="<?php echo esc_url($consultation_url); ?>" class="btn-primary" target="_blank" rel="noopener noreferrer">キャリアアドバイザーに無料相談する</a>
      </p>
      <?php endif; ?>
    </div>
  </section>

  <section class="card">
    <div class="card-head">あなたにおすすめの転職エージェント</div>
    <div class="card-body">
      <ul class="agent-list" id="agentList"></ul>
      <p class="agent-empty" id="agentEmpty" style="display:none;">
        条件にぴったり合うエージェントが見つかりませんでした。条件を少し広げて再度お試しください。
      </p>
    </div>
  </section>
</div>

<script>
// ここに salary-diagnosis-result.html から移植した JS（localStorage 読み込み、偏差値計算、
// AI アドバイス、job-site-diagnosis との連携ロジック）をそのまま貼り付ける想定。
// 既存の job_site_diagnosis_result ショートコードの直下で動いていた仕様を維持します。
</script>
