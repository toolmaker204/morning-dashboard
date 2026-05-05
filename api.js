// ============================================
// API層 - 天気・ニュースデータ取得
// 本番APIに差し替える際はこのファイルのみ変更する
// ============================================

// ---- 設定 ----
const WEATHER_API_KEY = 'd78eb32abf0046e6afb62945261204'; // WeatherAPI.com のAPIキー

// 47都道府県 → WeatherAPI用の都市名マッピング
const PREFECTURE_LOCATIONS = {
  '北海道': 'Sapporo', '青森県': 'Aomori', '岩手県': 'Morioka', '宮城県': 'Sendai',
  '秋田県': 'Akita', '山形県': 'Yamagata', '福島県': 'Fukushima',
  '茨城県': 'Mito', '栃木県': 'Utsunomiya', '群馬県': 'Maebashi', '埼玉県': 'Saitama',
  '千葉県': 'Chiba', '東京都': 'Tokyo', '神奈川県': 'Yokohama',
  '新潟県': 'Niigata', '富山県': 'Toyama', '石川県': 'Kanazawa', '福井県': 'Fukui',
  '山梨県': 'Kofu', '長野県': 'Nagano', '岐阜県': 'Gifu', '静岡県': 'Shizuoka',
  '愛知県': 'Nagoya', '三重県': 'Tsu',
  '滋賀県': 'Otsu', '京都府': 'Kyoto', '大阪府': 'Osaka', '兵庫県': 'Kobe',
  '奈良県': 'Nara', '和歌山県': 'Wakayama',
  '鳥取県': 'Tottori', '島根県': 'Matsue', '岡山県': 'Okayama', '広島県': 'Hiroshima',
  '山口県': 'Yamaguchi', '徳島県': 'Tokushima', '香川県': 'Takamatsu',
  '愛媛県': 'Matsuyama', '高知県': 'Kochi',
  '福岡県': 'Fukuoka', '佐賀県': 'Saga', '長崎県': 'Nagasaki', '熊本県': 'Kumamoto',
  '大分県': 'Oita', '宮崎県': 'Miyazaki', '鹿児島県': 'Kagoshima', '沖縄県': 'Naha',
};

const DEFAULT_PREFECTURE = '東京都';

function getSelectedPrefecture() {
  return localStorage.getItem('selected_prefecture') || DEFAULT_PREFECTURE;
}

function setSelectedPrefecture(pref) {
  localStorage.setItem('selected_prefecture', pref);
}

/**
 * WeatherAPI.com から天気データを取得し、アプリ内部形式に変換する
 * @returns {Promise<Object>} 天気データ
 */
async function fetchWeather() {
  const location = PREFECTURE_LOCATIONS[getSelectedPrefecture()] || 'Tokyo';
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${location}&days=1&aqi=no&lang=ja`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`);
  }

  const data = await res.json();
  return mapWeatherResponse(data);
}

/**
 * WeatherAPI.com のレスポンスをアプリ内部形式にマッピング
 */
function mapWeatherResponse(data) {
  const { location, current, forecast } = data;
  const today = forecast.forecastday[0];
  const { day, hour: hours } = today;

  const high = Math.round(day.maxtemp_c);
  const low = Math.round(day.mintemp_c);
  const rainChance = day.daily_chance_of_rain;
  // 外出時間帯（6時〜22時）の降水確率で判定
  const activeHours = hours.filter((h) => {
    const hr = new Date(h.time).getHours();
    return hr >= 6 && hr <= 22;
  });
  const maxRainInActiveHours = Math.max(...activeHours.map((h) => h.chance_of_rain));

  // 時間ごとのデータを変換
  const hourly = hours.map((h) => {
    const hourNum = new Date(h.time).getHours();
    return {
      hour: `${hourNum}時`,
      temp: Math.round(h.temp_c),
      icon: getWeatherEmoji(h.condition.code, h.is_day),
      weather: h.condition.text,
      rain: h.chance_of_rain,
    };
  });

  // 風向を日本語に変換
  const windDir = translateWindDir(current.wind_dir);
  const windSpeed = Math.round(current.wind_kph / 3.6); // km/h → m/s

  return {
    location: location.name,
    date: new Date().toLocaleDateString('ja-JP'),
    summary: day.condition.text,
    icon: getWeatherEmoji(day.condition.code, 1),
    high,
    low,
    humidity: current.humidity,
    wind: `${windDir} ${windSpeed}m/s`,
    rainChance,
    needUmbrella: maxRainInActiveHours >= 50,
    maxRainChance: maxRainInActiveHours,
    hourly,
    clothing: getClothingSuggestion(high, low),
  };
}

/**
 * WeatherAPI.com の condition code をアイコンに変換
 * https://www.weatherapi.com/docs/weather_conditions.json
 */
function getWeatherEmoji(code, isDay) {
  // 晴れ系
  if (code === 1000) return isDay ? '☀️' : '🌙';
  if (code === 1003) return isDay ? '🌤' : '🌙';
  // 曇り系
  if (code === 1006) return '⛅';
  if (code === 1009) return '☁️';
  // 霧系
  if ([1030, 1135, 1147].includes(code)) return '🌫️';
  // 雨系
  if ([1063, 1150, 1153, 1180, 1183].includes(code)) return '🌦️';
  if ([1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) return '🌧️';
  // 雷雨
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return '⛈️';
  // 雪系
  if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return '🌨️';
  // みぞれ
  if ([1069, 1072, 1168, 1171, 1198, 1201, 1204, 1207, 1237, 1249, 1252, 1261, 1264].includes(code)) return '🌨️';
  return '🌤';
}

/**
 * 風向の英語略称を日本語に変換
 */
function translateWindDir(dir) {
  const map = {
    N: '北', NNE: '北北東', NE: '北東', ENE: '東北東',
    E: '東', ESE: '東南東', SE: '南東', SSE: '南南東',
    S: '南', SSW: '南南西', SW: '南西', WSW: '西南西',
    W: '西', WNW: '西北西', NW: '北西', NNW: '北北西',
  };
  return map[dir] || dir;
}

/**
 * 最高気温・最低気温から服装を提案
 */
function getClothingSuggestion(high, low) {
  if (high >= 28) {
    return {
      level: 'tshirt',
      label: '半袖でOK',
      description: '暑い一日です。通気性の良い服装で涼しく過ごしましょう',
      items: [
        { name: '半袖Tシャツ', icon: 'tshirt' },
        { name: '短パン', icon: 'shorts' },
      ],
    };
  }
  if (high >= 23) {
    return {
      level: 'long-sleeve',
      label: '長袖シャツ',
      description: '過ごしやすい気温です。薄手の長袖が快適です',
      items: [
        { name: '長袖シャツ', icon: 'shirt' },
        { name: '長ズボン', icon: 'pants' },
      ],
    };
  }
  if (high >= 16) {
    return {
      level: 'light-jacket',
      label: '薄手の上着',
      description: `日中は暖かいですが${low < 12 ? '、朝晩は冷えます' : ''}。脱ぎ着しやすい服装が◎`,
      items: [
        { name: '長袖シャツ', icon: 'shirt' },
        { name: '薄手ジャケット', icon: 'jacket' },
        { name: '長ズボン', icon: 'pants' },
      ],
    };
  }
  if (high >= 8) {
    return {
      level: 'coat',
      label: 'コートが必要',
      description: '寒い一日です。しっかり防寒しましょう',
      items: [
        { name: 'ニット', icon: 'shirt' },
        { name: 'コート', icon: 'coat' },
        { name: 'マフラー', icon: 'scarf' },
        { name: '長ズボン', icon: 'pants' },
      ],
    };
  }
  return {
    level: 'heavy-coat',
    label: '厚手の防寒着',
    description: '厳しい寒さです。ダウンジャケットなど万全の防寒を',
    items: [
      { name: 'ダウンジャケット', icon: 'coat' },
      { name: 'マフラー', icon: 'scarf' },
      { name: '手袋', icon: 'gloves' },
      { name: 'ブーツ', icon: 'boots' },
    ],
  };
}

/**
 * ニュースデータを取得する（Google News RSS → rss2json.com 経由）
 * @param {string} category - カテゴリ
 * @returns {Promise<Array>} ニュース記事の配列
 */

// Google News RSS URL
const NEWS_RSS_URLS = {
  // 今日のニュース
  popular:       'https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja',
  economy:       'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtcGhHZ0pLVUNnQVAB?hl=ja&gl=JP&ceid=JP:ja',
  it:            'https://news.google.com/rss/search?q=%E3%83%86%E3%82%AF%E3%83%8E%E3%83%AD%E3%82%B8%E3%83%BC+OR+IT+OR+AI&hl=ja&gl=JP&ceid=JP:ja',
  sports:        'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtcGhHZ0pLVUNnQVAB?hl=ja&gl=JP&ceid=JP:ja',
  entertainment: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtcGhHZ0pLVUNnQVAB?hl=ja&gl=JP&ceid=JP:ja',
  world:         'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtcGhHZ0pLVUNnQVAB?hl=ja&gl=JP&ceid=JP:ja',
  // 今週のニュース（when:7d で直近7日に絞る）
  'weekly-popular':       'https://news.google.com/rss/search?q=%E8%A9%B1%E9%A1%8C+OR+%E6%B3%A8%E7%9B%AE+when%3A7d&hl=ja&gl=JP&ceid=JP:ja',
  'weekly-economy':       'https://news.google.com/rss/search?q=%E7%B5%8C%E6%B8%88+when%3A7d&hl=ja&gl=JP&ceid=JP:ja',
  'weekly-it':            'https://news.google.com/rss/search?q=%E3%83%86%E3%82%AF%E3%83%8E%E3%83%AD%E3%82%B8%E3%83%BC+OR+IT+OR+AI+when%3A7d&hl=ja&gl=JP&ceid=JP:ja',
  'weekly-sports':        'https://news.google.com/rss/search?q=%E3%82%B9%E3%83%9D%E3%83%BC%E3%83%84+when%3A7d&hl=ja&gl=JP&ceid=JP:ja',
  'weekly-entertainment': 'https://news.google.com/rss/search?q=%E3%82%A8%E3%83%B3%E3%82%BF%E3%83%A1+OR+%E8%8A%B8%E8%83%BD+when%3A7d&hl=ja&gl=JP&ceid=JP:ja',
  'weekly-world':         'https://news.google.com/rss/search?q=%E5%9B%BD%E9%9A%9B+OR+%E6%B5%B7%E5%A4%96+when%3A7d&hl=ja&gl=JP&ceid=JP:ja',
};

// ニュースキャッシュ（タブ切替時の再取得を防ぐ）
const newsCache = {};

async function fetchNews(category) {
  if (newsCache[category]) return newsCache[category];

  const rssUrl = NEWS_RSS_URLS[category];
  if (!rssUrl) return [];

  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(`News API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.status !== 'ok' || !data.items) {
    throw new Error('News RSS parse error');
  }

  const articles = data.items.slice(0, 5).map((item) => {
    const titleParts = item.title.split(' - ');
    const source = titleParts.length > 1 ? titleParts.pop().trim() : '';
    const title = titleParts.join(' - ').trim();

    const pubDate = new Date(item.pubDate);
    const publishedAt = `${pubDate.getMonth() + 1}/${pubDate.getDate()} ${pubDate.getHours()}:${String(pubDate.getMinutes()).padStart(2, '0')}`;

    const summary = item.description
      ? item.description.replace(/<[^>]*>/g, '').trim().slice(0, 200)
      : '';

    return {
      title,
      url: item.link,
      source,
      publishedAt,
      summary: summary || 'この記事の詳細は元のサイトでご覧ください。',
    };
  });

  newsCache[category] = articles;
  return articles;
}

/**
 * 全ニュースカテゴリをバックグラウンドでプリフェッチ
 */
function prefetchAllNews() {
  Object.keys(NEWS_RSS_URLS).forEach((cat) => {
    fetchNews(cat).catch(() => {});
  });
}

// ---- 鉄道遅延情報 ----

// 遅延情報キャッシュ
let trainDelayCache = null;

/**
 * タイムアウト付きfetch
 */
function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * 鉄道遅延情報を取得する
 * 複数経路を並列で試し、最初に成功した結果を返す
 * @returns {Promise<Array>} 遅延中の路線配列 [{name, company}]
 */
async function fetchTrainDelay() {
  if (trainDelayCache) return trainDelayCache;

  const DELAY_API = 'https://tetsudo.rti-giken.jp/free/delay.json';

  // 直接アクセスとCORSプロキシ経由を並列で試す
  const attempts = [
    fetchWithTimeout(DELAY_API, 8000)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
    fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(DELAY_API)}`, 8000)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
  ];

  // 最初に成功したものを採用
  const data = await Promise.any(attempts);
  trainDelayCache = data;
  return trainDelayCache;
}

/**
 * 遅延情報をバックグラウンドでプリフェッチ
 */
function prefetchTrainDelay() {
  fetchTrainDelay().catch(() => {});
}
