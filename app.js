// ============================================
// 朝ダッシュボード - メインアプリケーション
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  loadWeather();
  loadNews('economy', 'news-list');
  loadNews('weekly-economy', 'weekly-news-list');
  setupNewsTabs();
  // 他のタブのデータをバックグラウンドでプリフェッチ
  prefetchAllNews();
});

// ---- ヘッダー（日付表示） ----

function renderHeader() {
  const now = new Date();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const day = days[now.getDay()];
  const year = now.getFullYear();

  const hour = now.getHours();
  let greeting = 'おはようございます';
  if (hour >= 12 && hour < 18) greeting = 'こんにちは';
  else if (hour >= 18) greeting = 'こんばんは';

  document.getElementById('greeting').textContent = greeting;
  document.getElementById('date').textContent = `${year}年${month}月${date}日`;
  document.getElementById('day').textContent = `${day}曜日`;
}

// ---- 天気セクション ----

async function loadWeather() {
  const container = document.getElementById('weather-content');
  container.innerHTML = loadingHTML();

  try {
    const data = await fetchWeather();
    renderWeather(data);
  } catch (e) {
    container.innerHTML = '<p style="color:#ef4444;padding:20px;">天気データの取得に失敗しました</p>';
    console.error('Weather fetch error:', e);
  }
}

function renderWeather(data) {
  const container = document.getElementById('weather-content');

  container.innerHTML = `
    <div class="weather-summary">
      <span class="weather-summary__icon">${data.icon}</span>
      <div class="weather-summary__info">
        <div class="weather-summary__text">${data.summary}</div>
        <div class="weather-summary__location">${data.location}</div>
      </div>
      <div class="weather-temps">
        <div>
          <div class="weather-temps__high">${data.high}°</div>
          <div class="weather-temps__label">最高</div>
        </div>
        <div>
          <div class="weather-temps__low">${data.low}°</div>
          <div class="weather-temps__label">最低</div>
        </div>
      </div>
    </div>

    <div class="weather-detail">
      <div class="weather-detail__item">💧 湿度 ${data.humidity}%</div>
      <div class="weather-detail__item">💨 ${data.wind}</div>
      <div class="weather-detail__item">🌧 降水確率 ${data.rainChance}%</div>
    </div>

    <div class="weather-timeline">
      ${data.hourly.map((h) => `
        <div class="weather-timeline__item">
          <div class="weather-timeline__hour">${h.hour}</div>
          <div class="weather-timeline__icon">${h.icon}</div>
          <div class="weather-timeline__temp">${h.temp}°</div>
          <div class="weather-timeline__rain">💧${h.rain}%</div>
        </div>
      `).join('')}
    </div>

    <div class="weather-chart">
      <canvas id="temp-chart"></canvas>
    </div>

    <div class="umbrella-info ${data.needUmbrella ? 'umbrella-info--warn' : 'umbrella-info--safe'}">
      <span class="umbrella-info__icon">${data.needUmbrella ? '☂️' : '☀️'}</span>
      ${data.needUmbrella
        ? '今日は傘を持っていきましょう'
        : '今日は傘の心配はなさそうです'}
    </div>

    <div class="clothing-card">
      <div class="clothing-card__visual">
        ${getClothingSVG(data.clothing.level)}
      </div>
      <div class="clothing-card__info">
        <div class="clothing-card__label">${data.clothing.label}</div>
        <div class="clothing-card__items">
          ${data.clothing.items.map((item) => `
            <span class="clothing-card__item">
              ${getItemIcon(item.icon)} ${item.name}
            </span>
          `).join('')}
        </div>
        <div class="clothing-card__desc">${data.clothing.description}</div>
      </div>
    </div>
  `;

  renderTempChart(data.hourly);

  // タイムラインを8時の位置にスクロール
  const timeline = container.querySelector('.weather-timeline');
  const items = timeline.querySelectorAll('.weather-timeline__item');
  const targetIdx = data.hourly.findIndex((h) => h.hour === '8時');
  if (timeline && items[targetIdx]) {
    timeline.scrollLeft = items[targetIdx].offsetLeft - timeline.offsetLeft;
  }
}

function renderTempChart(hourly) {
  const temps = hourly.map((h) => h.temp);
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);

  // 最高・最低・平均に最も近いインデックスを特定
  const maxIdx = temps.indexOf(maxTemp);
  const minIdx = temps.indexOf(minTemp);
  // 平均に最も近い点を探す（最高・最低と被らないように）
  let avgIdx = -1;
  let avgDiff = Infinity;
  temps.forEach((t, i) => {
    if (i !== maxIdx && i !== minIdx && Math.abs(t - avgTemp) < avgDiff) {
      avgDiff = Math.abs(t - avgTemp);
      avgIdx = i;
    }
  });

  const labelIndices = { max: maxIdx, min: minIdx, avg: avgIdx };

  // ポイントのスタイルをカスタマイズ
  const pointRadius = temps.map((_, i) =>
    i === maxIdx || i === minIdx || i === avgIdx ? 5 : 2
  );
  const pointBgColor = temps.map((_, i) => {
    if (i === maxIdx) return '#ef4444';
    if (i === minIdx) return '#3b82f6';
    if (i === avgIdx) return '#8b5cf6';
    return '#ff8a5c';
  });
  const pointBorderColor = temps.map((_, i) => {
    if (i === maxIdx) return '#fff';
    if (i === minIdx) return '#fff';
    if (i === avgIdx) return '#fff';
    return 'transparent';
  });
  const pointBorderWidth = temps.map((_, i) =>
    i === maxIdx || i === minIdx || i === avgIdx ? 2 : 0
  );

  // 気温ラベルを描画するプラグイン（常にポイントの上に表示）
  const tempLabelPlugin = {
    id: 'tempLabels',
    afterDatasetsDraw(chart) {
      const { ctx: c, chartArea } = chart;
      const meta = chart.getDatasetMeta(0);

      const items = [
        { idx: labelIndices.max, label: `${maxTemp}°`, color: '#ef4444', tag: '最高' },
        { idx: labelIndices.min, label: `${minTemp}°`, color: '#3b82f6', tag: '最低' },
        { idx: labelIndices.avg, label: `${avgTemp}°`, color: '#8b5cf6', tag: '平均' },
      ];

      items.forEach(({ idx, label, color, tag }) => {
        if (idx < 0) return;
        const point = meta.data[idx];
        const x = point.x;
        const y = point.y;

        const text = `${tag} ${label}`;
        c.save();
        c.font = 'bold 10px -apple-system, sans-serif';
        const textW = c.measureText(text).width;
        const padX = 5;
        const padY = 3;
        const boxW = textW + padX * 2;
        const boxH = 16 + padY * 2;

        // 常にポイントの上に配置。上端にぶつかる場合は下に出す
        let centerY = y - 18;
        if (centerY - boxH / 2 < chartArea.top) {
          centerY = y + 18;
        }

        // 左右がチャートエリアからはみ出さないように補正
        let centerX = x;
        if (centerX - boxW / 2 < chartArea.left) centerX = chartArea.left + boxW / 2 + 2;
        if (centerX + boxW / 2 > chartArea.right) centerX = chartArea.right - boxW / 2 - 2;

        // 白背景 + 色付きボーダー
        c.fillStyle = '#ffffff';
        c.globalAlpha = 0.92;
        c.beginPath();
        c.roundRect(centerX - boxW / 2, centerY - boxH / 2, boxW, boxH, 4);
        c.fill();

        c.globalAlpha = 1;
        c.strokeStyle = color;
        c.lineWidth = 1.5;
        c.beginPath();
        c.roundRect(centerX - boxW / 2, centerY - boxH / 2, boxW, boxH, 4);
        c.stroke();

        // テキスト
        c.fillStyle = color;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(text, centerX, centerY);
        c.restore();
      });
    },
  };

  const ctx = document.getElementById('temp-chart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: hourly.map((h) => h.hour),
      datasets: [
        {
          label: '気温 (°C)',
          data: temps,
          borderColor: '#ff8a5c',
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return 'rgba(255,138,92,0.1)';
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, 'rgba(255,138,92,0.25)');
            g.addColorStop(1, 'rgba(255,138,92,0)');
            return g;
          },
          fill: true,
          tension: 0.4,
          pointRadius,
          pointBackgroundColor: pointBgColor,
          pointBorderColor,
          pointBorderWidth,
          borderWidth: 2.5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 24, bottom: 8 },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y}°C`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, maxRotation: 0 },
        },
        y: {
          grid: { color: '#f3f4f6' },
          ticks: {
            font: { size: 11 },
            callback: (v) => `${v}°`,
          },
        },
      },
    },
    plugins: [tempLabelPlugin],
  });
}

// ---- ニュースセクション ----

function setupNewsTabs() {
  // 今日のニュースタブ
  document.querySelectorAll('#news-list').forEach(() => {
    document.querySelectorAll('.news-tabs:not(#weekly-news-tabs) .news-tabs__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.closest('.news-tabs').querySelectorAll('.news-tabs__btn').forEach((b) => b.classList.remove('news-tabs__btn--active'));
        btn.classList.add('news-tabs__btn--active');
        loadNews(btn.dataset.category, 'news-list');
      });
    });
  });

  // 今週のニュースタブ
  document.querySelectorAll('#weekly-news-tabs .news-tabs__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#weekly-news-tabs .news-tabs__btn').forEach((b) => b.classList.remove('news-tabs__btn--active'));
      btn.classList.add('news-tabs__btn--active');
      loadNews(btn.dataset.category, 'weekly-news-list');
    });
  });
}

// コンテナ → カテゴリのマッピング（サムネイル再描画用）
const containerCategoryMap = {};

async function loadNews(category, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = loadingHTML();
  containerCategoryMap[containerId] = category;

  try {
    const articles = await fetchNews(category);
    renderNews(articles, containerId);
  } catch (e) {
    container.innerHTML = '<p style="color:#ef4444;padding:20px;">ニュースの取得に失敗しました</p>';
    console.error('News fetch error:', e);
  }
}

// サムネイル取得完了時にリストを再描画
document.addEventListener('thumbnails-loaded', (e) => {
  const { category } = e.detail;
  for (const [containerId, cat] of Object.entries(containerCategoryMap)) {
    if (cat === category && newsCache[category]) {
      renderNews(newsCache[category], containerId);
    }
  }
});

// 各コンテナごとに記事を保持
const newsArticlesMap = {};

function renderNews(articles, containerId) {
  const container = document.getElementById(containerId);
  newsArticlesMap[containerId] = articles;

  if (!articles.length) {
    container.innerHTML = '<p style="padding:20px;color:#6b7280;">ニュースがありません</p>';
    return;
  }

  container.innerHTML = `
    <ul class="news-list">
      ${articles
        .map(
          (article, i) => `
        <li class="news-list__item">
          <button class="news-list__btn" data-index="${i}" data-container="${containerId}">
            <span class="news-list__number">${i + 1}</span>
            ${article.thumbnail
              ? `<img class="news-list__thumb" src="${article.thumbnail}" alt="" loading="lazy" onerror="this.parentElement.querySelector('.news-list__thumb-placeholder')?.classList.remove('news-list__thumb-placeholder--hidden');this.style.display='none'">
                 <span class="news-list__thumb-placeholder news-list__thumb-placeholder--hidden">📰</span>`
              : '<span class="news-list__thumb-placeholder">📰</span>'}
            <span class="news-list__body">
              <span class="news-list__title">${article.title}</span>
              <span class="news-list__meta">${article.source}${article.source && article.publishedAt ? ' ・ ' : ''}${article.publishedAt}</span>
            </span>
            <span class="news-list__arrow">›</span>
          </button>
        </li>`
        )
        .join('')}
    </ul>
  `;

  container.querySelectorAll('.news-list__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cid = btn.dataset.container;
      const article = newsArticlesMap[cid][btn.dataset.index];
      openNewsModal(article);
    });
  });
}

// ---- ニュース詳細モーダル ----

function openNewsModal(article) {
  const existing = document.getElementById('news-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'news-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-handle"></div>
      <button class="modal-close" aria-label="閉じる">&times;</button>
      <div class="modal-meta">
        <span class="modal-source">${article.source || ''}</span>
        <span class="modal-date">${article.publishedAt || ''}</span>
      </div>
      <h3 class="modal-title">${article.title}</h3>
      ${article.thumbnail ? `<img class="modal-thumb" src="${article.thumbnail}" alt="" onerror="this.style.display='none'">` : ''}
      <p class="modal-summary">${article.summary || '詳細情報はありません。'}</p>
      <a class="modal-link" href="${article.url}" target="_blank" rel="noopener">
        元の記事を読む →
      </a>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('modal-overlay--visible'));

  modal.querySelector('.modal-close').addEventListener('click', () => closeNewsModal(modal));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeNewsModal(modal);
  });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      closeNewsModal(modal);
      document.removeEventListener('keydown', handler);
    }
  });
}

function closeNewsModal(modal) {
  modal.classList.remove('modal-overlay--visible');
  modal.addEventListener('transitionend', () => modal.remove(), { once: true });
}

// ---- 服装SVG ----

function getClothingSVG(level) {
  const svgs = {
    'tshirt': `
      <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 人物 -->
        <circle cx="60" cy="22" r="16" fill="#FFD6BA"/>
        <ellipse cx="60" cy="20" rx="5" ry="3" fill="none"/>
        <circle cx="53" cy="19" r="1.5" fill="#5D4E42"/>
        <circle cx="67" cy="19" r="1.5" fill="#5D4E42"/>
        <path d="M55 26 Q60 30 65 26" stroke="#E8967A" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- 半袖Tシャツ -->
        <path d="M42 42 L32 52 L38 56 L46 48 L46 85 L74 85 L74 48 L82 56 L88 52 L78 42 L68 38 L52 38 Z" fill="#4DB6AC" stroke="#3A9E93" stroke-width="1"/>
        <path d="M52 38 Q60 44 68 38" stroke="#3A9E93" stroke-width="1" fill="none"/>
        <!-- 腕 -->
        <line x1="38" y1="56" x2="34" y2="72" stroke="#FFD6BA" stroke-width="6" stroke-linecap="round"/>
        <line x1="82" y1="56" x2="86" y2="72" stroke="#FFD6BA" stroke-width="6" stroke-linecap="round"/>
        <!-- 短パン -->
        <path d="M46 85 L44 110 L56 110 L60 92 L64 110 L76 110 L74 85 Z" fill="#5C7CFA" stroke="#4A6CE0" stroke-width="1"/>
        <!-- 脚 -->
        <line x1="50" y1="110" x2="48" y2="130" stroke="#FFD6BA" stroke-width="5" stroke-linecap="round"/>
        <line x1="70" y1="110" x2="72" y2="130" stroke="#FFD6BA" stroke-width="5" stroke-linecap="round"/>
        <!-- 靴 -->
        <ellipse cx="46" cy="133" rx="8" ry="4" fill="#FF8A65"/>
        <ellipse cx="74" cy="133" rx="8" ry="4" fill="#FF8A65"/>
      </svg>`,
    'long-sleeve': `
      <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="22" r="16" fill="#FFD6BA"/>
        <circle cx="53" cy="19" r="1.5" fill="#5D4E42"/>
        <circle cx="67" cy="19" r="1.5" fill="#5D4E42"/>
        <path d="M55 26 Q60 30 65 26" stroke="#E8967A" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- 長袖シャツ -->
        <path d="M42 42 L30 54 L34 58 L46 48 L46 88 L74 88 L74 48 L86 58 L90 54 L78 42 L68 38 L52 38 Z" fill="#7E9FD6" stroke="#6B8DC4" stroke-width="1"/>
        <path d="M52 38 Q60 44 68 38" stroke="#6B8DC4" stroke-width="1" fill="none"/>
        <!-- 長袖 -->
        <path d="M34 58 L30 78" stroke="#7E9FD6" stroke-width="8" stroke-linecap="round"/>
        <path d="M86 58 L90 78" stroke="#7E9FD6" stroke-width="8" stroke-linecap="round"/>
        <circle cx="28" cy="80" r="4" fill="#FFD6BA"/>
        <circle cx="92" cy="80" r="4" fill="#FFD6BA"/>
        <!-- 長ズボン -->
        <path d="M46 88 L44 128 L56 128 L60 96 L64 128 L76 128 L74 88 Z" fill="#5D6D7E" stroke="#4E5D6E" stroke-width="1"/>
        <!-- 靴 -->
        <ellipse cx="50" cy="131" rx="8" ry="4" fill="#8D6E63"/>
        <ellipse cx="70" cy="131" rx="8" ry="4" fill="#8D6E63"/>
      </svg>`,
    'light-jacket': `
      <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="22" r="16" fill="#FFD6BA"/>
        <circle cx="53" cy="19" r="1.5" fill="#5D4E42"/>
        <circle cx="67" cy="19" r="1.5" fill="#5D4E42"/>
        <path d="M55 26 Q60 30 65 26" stroke="#E8967A" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- インナーシャツ -->
        <path d="M48 42 L48 88 L72 88 L72 42 Z" fill="#E8E8E8" stroke="#D0D0D0" stroke-width="0.5"/>
        <!-- ジャケット -->
        <path d="M40 42 L28 56 L32 60 L44 48 L44 90 L58 90 L58 42 Z" fill="#FF8A65" stroke="#E07850" stroke-width="1"/>
        <path d="M80 42 L92 56 L88 60 L76 48 L76 90 L62 90 L62 42 Z" fill="#FF8A65" stroke="#E07850" stroke-width="1"/>
        <path d="M52 38 Q60 44 68 38" stroke="#D0D0D0" stroke-width="1" fill="none"/>
        <!-- ジッパーライン -->
        <line x1="60" y1="42" x2="60" y2="90" stroke="#E07850" stroke-width="1.5" stroke-dasharray="3 2"/>
        <!-- 袖 -->
        <path d="M32 60 L28 80" stroke="#FF8A65" stroke-width="9" stroke-linecap="round"/>
        <path d="M88 60 L92 80" stroke="#FF8A65" stroke-width="9" stroke-linecap="round"/>
        <circle cx="26" cy="82" r="4" fill="#FFD6BA"/>
        <circle cx="94" cy="82" r="4" fill="#FFD6BA"/>
        <!-- 長ズボン -->
        <path d="M44 90 L42 128 L54 128 L60 98 L66 128 L78 128 L76 90 Z" fill="#4A6274" stroke="#3D5565" stroke-width="1"/>
        <!-- 靴 -->
        <ellipse cx="48" cy="131" rx="8" ry="4" fill="#8D6E63"/>
        <ellipse cx="72" cy="131" rx="8" ry="4" fill="#8D6E63"/>
      </svg>`,
    'coat': `
      <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="22" r="16" fill="#FFD6BA"/>
        <circle cx="53" cy="19" r="1.5" fill="#5D4E42"/>
        <circle cx="67" cy="19" r="1.5" fill="#5D4E42"/>
        <path d="M55 26 Q60 30 65 26" stroke="#E8967A" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- ニット + コート -->
        <path d="M48 42 L48 88 L72 88 L72 42 Z" fill="#C5CAE9" stroke="#B0B8D6" stroke-width="0.5"/>
        <path d="M38 42 L24 58 L30 62 L42 48 L42 100 L58 100 L58 42 Z" fill="#6D7F9B" stroke="#5A6D88" stroke-width="1"/>
        <path d="M82 42 L96 58 L90 62 L78 48 L78 100 L62 100 L62 42 Z" fill="#6D7F9B" stroke="#5A6D88" stroke-width="1"/>
        <line x1="60" y1="42" x2="60" y2="100" stroke="#5A6D88" stroke-width="1.5"/>
        <!-- 襟 -->
        <path d="M50 38 L54 48 L60 42 L66 48 L70 38" stroke="#5A6D88" stroke-width="2" fill="#6D7F9B"/>
        <!-- 袖 -->
        <path d="M30 62 L26 82" stroke="#6D7F9B" stroke-width="10" stroke-linecap="round"/>
        <path d="M90 62 L94 82" stroke="#6D7F9B" stroke-width="10" stroke-linecap="round"/>
        <circle cx="24" cy="84" r="4" fill="#FFD6BA"/>
        <circle cx="96" cy="84" r="4" fill="#FFD6BA"/>
        <!-- マフラー -->
        <path d="M50 36 Q60 42 70 36" stroke="#FF8A65" stroke-width="4" fill="none" stroke-linecap="round"/>
        <line x1="52" y1="38" x2="48" y2="52" stroke="#FF8A65" stroke-width="4" stroke-linecap="round"/>
        <!-- 長ズボン -->
        <path d="M42 100 L40 128 L52 128 L60 106 L68 128 L80 128 L78 100 Z" fill="#3E4A5C" stroke="#2E3A4C" stroke-width="1"/>
        <!-- ブーツ -->
        <path d="M38 126 L38 134 L54 134 L54 126 Z" rx="2" fill="#5D4037"/>
        <path d="M66 126 L66 134 L82 134 L82 126 Z" rx="2" fill="#5D4037"/>
      </svg>`,
    'heavy-coat': `
      <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="22" r="16" fill="#FFD6BA"/>
        <circle cx="53" cy="19" r="1.5" fill="#5D4E42"/>
        <circle cx="67" cy="19" r="1.5" fill="#5D4E42"/>
        <path d="M55 26 Q60 30 65 26" stroke="#E8967A" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- ダウンジャケット -->
        <path d="M36 40 L20 58 L28 64 L40 50 L40 105 L80 105 L80 50 L92 64 L100 58 L84 40 L70 36 L50 36 Z" fill="#5C6BC0" stroke="#4A59AE" stroke-width="1"/>
        <!-- キルティング線 -->
        <line x1="40" y1="55" x2="80" y2="55" stroke="#4A59AE" stroke-width="0.8"/>
        <line x1="40" y1="68" x2="80" y2="68" stroke="#4A59AE" stroke-width="0.8"/>
        <line x1="40" y1="81" x2="80" y2="81" stroke="#4A59AE" stroke-width="0.8"/>
        <line x1="40" y1="94" x2="80" y2="94" stroke="#4A59AE" stroke-width="0.8"/>
        <line x1="60" y1="40" x2="60" y2="105" stroke="#4A59AE" stroke-width="1"/>
        <!-- フード -->
        <path d="M44 36 Q42 24 50 20" stroke="#5C6BC0" stroke-width="5" fill="none" stroke-linecap="round"/>
        <!-- 袖 -->
        <path d="M28 64 L22 86" stroke="#5C6BC0" stroke-width="12" stroke-linecap="round"/>
        <path d="M92 64 L98 86" stroke="#5C6BC0" stroke-width="12" stroke-linecap="round"/>
        <!-- 手袋 -->
        <ellipse cx="20" cy="89" rx="5" ry="4" fill="#E57373"/>
        <ellipse cx="100" cy="89" rx="5" ry="4" fill="#E57373"/>
        <!-- マフラー -->
        <path d="M48 36 Q60 44 72 36" stroke="#FF8A65" stroke-width="5" fill="none" stroke-linecap="round"/>
        <line x1="50" y1="38" x2="44" y2="56" stroke="#FF8A65" stroke-width="5" stroke-linecap="round"/>
        <!-- 長ズボン -->
        <path d="M40 105 L38 128 L52 128 L60 110 L68 128 L82 128 L80 105 Z" fill="#3E4A5C" stroke="#2E3A4C" stroke-width="1"/>
        <!-- ブーツ -->
        <path d="M36 126 L36 136 L54 136 L54 126 Z" rx="2" fill="#4E342E"/>
        <path d="M66 126 L66 136 L86 136 L86 126 Z" rx="2" fill="#4E342E"/>
      </svg>`,
  };
  return svgs[level] || svgs['light-jacket'];
}

function getItemIcon(icon) {
  const icons = {
    'tshirt': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2 L2 6 L5 8 L5 20 L19 20 L19 8 L22 6 L16 2 L13 5 L11 5 Z"/></svg>',
    'shirt': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2 L2 6 L2 10 L5 8 L5 22 L19 22 L19 8 L22 10 L22 6 L16 2 L13 5 L11 5 Z"/></svg>',
    'jacket': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2 L2 6 L2 14 L5 12 L5 22 L11 22 L11 2 Z M16 2 L22 6 L22 14 L19 12 L19 22 L13 22 L13 2 Z"/></svg>',
    'pants': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2 L4 22 L10 22 L12 10 L14 22 L20 22 L20 2 Z"/></svg>',
    'shorts': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2 L4 16 L10 16 L12 8 L14 16 L20 16 L20 2 Z"/></svg>',
    'coat': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2 L2 6 L2 16 L5 14 L5 22 L11 22 L11 2 Z M16 2 L22 6 L22 16 L19 14 L19 22 L13 22 L13 2 Z"/><line x1="12" y1="2" x2="12" y2="22"/></svg>',
    'scarf': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4 Q12 8 16 4 M9 6 L7 18"/></svg>',
    'boots': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 2 L7 18 L5 20 L5 22 L18 22 L18 20 L17 18 L17 2 Z"/></svg>',
    'gloves': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12 L6 4 Q6 2 8 2 Q10 2 10 4 L10 8 L10 4 Q10 2 12 2 Q14 2 14 4 L14 8 L14 5 Q14 3 16 3 Q18 3 18 5 L18 14 Q18 20 12 22 L6 22 Z"/></svg>',
  };
  return icons[icon] || '';
}

// ---- ユーティリティ ----

function loadingHTML() {
  return '<div class="loading"><div class="loading__spinner"></div>読み込み中...</div>';
}
