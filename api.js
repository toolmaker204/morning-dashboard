// ============================================
// API層 - 天気・ニュースデータ取得
// 本番APIに差し替える際はこのファイルのみ変更する
// ============================================

/**
 * 天気データを取得する
 * @returns {Promise<Object>} 天気データ
 */
async function fetchWeather() {
  // TODO: 本番APIに差し替え
  // 例: const res = await fetch('https://api.openweathermap.org/...');
  //     return await res.json();

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        location: '東京',
        date: new Date().toLocaleDateString('ja-JP'),
        summary: '晴れのち曇り',
        icon: '⛅',
        high: 22,
        low: 13,
        humidity: 55,
        wind: '南東 3m/s',
        rainChance: 20,
        needUmbrella: false,
        hourly: [
          { hour: '0時',  temp: 10, icon: '🌙', weather: '晴れ',   rain: 0  },
          { hour: '1時',  temp: 10, icon: '🌙', weather: '晴れ',   rain: 0  },
          { hour: '2時',  temp: 9,  icon: '🌙', weather: '晴れ',   rain: 0  },
          { hour: '3時',  temp: 9,  icon: '🌙', weather: '晴れ',   rain: 0  },
          { hour: '4時',  temp: 9,  icon: '🌙', weather: '晴れ',   rain: 0  },
          { hour: '5時',  temp: 10, icon: '🌅', weather: '晴れ',   rain: 0  },
          { hour: '6時',  temp: 13, icon: '🌅', weather: '晴れ',   rain: 0  },
          { hour: '7時',  temp: 14, icon: '☀️', weather: '晴れ',   rain: 0  },
          { hour: '8時',  temp: 15, icon: '☀️', weather: '晴れ',   rain: 0  },
          { hour: '9時',  temp: 17, icon: '☀️', weather: '晴れ',   rain: 5  },
          { hour: '10時', temp: 19, icon: '🌤', weather: '晴れ',   rain: 5  },
          { hour: '11時', temp: 20, icon: '🌤', weather: '晴れ',   rain: 10 },
          { hour: '12時', temp: 21, icon: '⛅', weather: '曇り',   rain: 15 },
          { hour: '13時', temp: 22, icon: '⛅', weather: '曇り',   rain: 20 },
          { hour: '14時', temp: 22, icon: '☁️', weather: '曇り',   rain: 25 },
          { hour: '15時', temp: 21, icon: '☁️', weather: '曇り',   rain: 30 },
          { hour: '16時', temp: 20, icon: '☁️', weather: '曇り',   rain: 30 },
          { hour: '17時', temp: 18, icon: '🌥', weather: '曇り',   rain: 25 },
          { hour: '18時', temp: 16, icon: '🌇', weather: '曇り',   rain: 20 },
          { hour: '19時', temp: 15, icon: '🌙', weather: '曇り',   rain: 15 },
          { hour: '20時', temp: 14, icon: '🌙', weather: '晴れ',   rain: 10 },
          { hour: '21時', temp: 13, icon: '🌙', weather: '晴れ',   rain: 5  },
          { hour: '22時', temp: 12, icon: '🌙', weather: '晴れ',   rain: 0  },
          { hour: '23時', temp: 11, icon: '🌙', weather: '晴れ',   rain: 0  },
        ],
        clothing: {
          level: 'light-jacket',  // 'tshirt' | 'long-sleeve' | 'light-jacket' | 'coat' | 'heavy-coat'
          label: '薄手の上着',
          description: '日中は暖かいですが、朝晩は冷えます。脱ぎ着しやすい服装が◎',
          items: [
            { name: '長袖シャツ', icon: 'shirt' },
            { name: '薄手ジャケット', icon: 'jacket' },
            { name: '長ズボン', icon: 'pants' },
          ],
        },
      });
    }, 300);
  });
}

/**
 * ニュースデータを取得する
 * @param {string} category - カテゴリ ('economy' | 'it' | 'popular')
 * @returns {Promise<Array>} ニュース記事の配列
 */
async function fetchNews(category) {
  // TODO: 本番APIに差し替え
  // 例: const res = await fetch(`https://newsapi.org/v2/top-headlines?category=${category}&...`);
  //     return (await res.json()).articles.slice(0, 5);

  const mockNews = {
    economy: [
      {
        title: '日経平均株価、3万9000円台を回復 半導体関連が牽引',
        url: '#',
        source: '日本経済新聞',
        publishedAt: '2026-04-12 06:30',
        summary: '12日の東京株式市場で日経平均株価が3万9000円台を回復した。半導体関連銘柄が買われ、全体を牽引。米国のハイテク株高を受けて投資家心理が改善し、朝方から幅広い銘柄に買いが入った。市場関係者は「当面は半導体セクターの決算動向が相場の鍵を握る」と指摘している。',
      },
      {
        title: '日銀、金融政策の現状維持を決定 追加利上げは慎重姿勢',
        url: '#',
        source: 'ロイター',
        publishedAt: '2026-04-12 05:45',
        summary: '日本銀行は金融政策決定会合で現行の政策金利を据え置くことを決定した。植田総裁は会見で「賃金と物価の好循環を確認しつつ、慎重に判断していく」と述べ、次回の利上げ時期については明言を避けた。市場では年内にもう1回の利上げが織り込まれている。',
      },
      {
        title: '円相場、1ドル=150円台で推移 米雇用統計を控え様子見',
        url: '#',
        source: 'Bloomberg',
        publishedAt: '2026-04-12 07:00',
        summary: '外国為替市場で円相場は1ドル=150円台で小幅な動きとなっている。今週末に発表される米雇用統計を控え、投資家はポジションの調整に慎重な姿勢を見せている。アナリストは「雇用統計の結果次第でFRBの利下げ見通しが変わる可能性がある」と分析している。',
      },
      {
        title: '国内GDP、年率2.1%成長 個人消費が回復基調に',
        url: '#',
        source: '朝日新聞',
        publishedAt: '2026-04-11 21:00',
        summary: '内閣府が発表した2026年1-3月期のGDP速報値は、実質ベースで前期比年率2.1%増となった。個人消費が前期比0.8%増と3四半期連続でプラスとなり、景気回復の柱となっている。賃上げの効果が消費に波及し始めたとの見方が広がっている。',
      },
      {
        title: '大手銀行グループ、過去最高益を更新 金利上昇が追い風',
        url: '#',
        source: '読売新聞',
        publishedAt: '2026-04-11 18:30',
        summary: '三菱UFJ、三井住友、みずほの3メガバンクグループの2025年度決算が出そろい、いずれも過去最高益を更新した。日銀の金融政策正常化に伴う金利上昇が貸出利ざやの改善につながった。各グループは株主還元の強化も発表し、自社株買いの規模を拡大する方針。',
      },
    ],
    it: [
      {
        title: 'Apple、次世代AIチップ「M5」の開発を加速 2026年後半に発表か',
        url: '#',
        source: 'TechCrunch',
        publishedAt: '2026-04-12 07:15',
        summary: 'Appleが次世代プロセッサ「M5」の開発を加速させていることが関係者の話で明らかになった。3nmプロセスの改良版を採用し、AI処理性能を大幅に向上させる。Neural Engineのコア数が倍増し、オンデバイスでの大規模言語モデル実行が可能になるという。',
      },
      {
        title: 'OpenAI、新モデル「GPT-5」のベータテストを開始',
        url: '#',
        source: 'The Verge',
        publishedAt: '2026-04-12 06:00',
        summary: 'OpenAIは次世代AIモデル「GPT-5」の限定ベータテストを開始したと発表した。マルチモーダル性能が大幅に向上し、複雑な推論タスクにおいてGPT-4を大きく上回る性能を示しているという。一般公開は2026年夏を予定している。',
      },
      {
        title: 'Google Cloud、日本リージョンにAI専用データセンターを新設',
        url: '#',
        source: '日経クロステック',
        publishedAt: '2026-04-11 22:00',
        summary: 'Google Cloudは日本国内にAIワークロード専用のデータセンターを新設すると発表した。投資額は約3000億円で、2027年の稼働を目指す。国内企業のAI活用需要の高まりに対応し、データの国内保管を求める規制対応も視野に入れている。',
      },
      {
        title: '国内SaaS市場、前年比25%増の2兆円規模に成長',
        url: '#',
        source: 'ITmedia',
        publishedAt: '2026-04-11 19:00',
        summary: '調査会社のレポートによると、国内SaaS市場は2025年度に前年比25%増の約2兆円規模に達した。特にAI機能を搭載したSaaSの成長が著しく、業務効率化やDX推進を背景に中堅・中小企業への浸透が加速している。',
      },
      {
        title: 'サイバーセキュリティ人材、2026年に30万人不足の見通し',
        url: '#',
        source: 'ZDNet Japan',
        publishedAt: '2026-04-11 16:00',
        summary: '経済産業省の調査で、国内のサイバーセキュリティ人材が2026年時点で約30万人不足する見通しが明らかになった。AI活用による攻撃の高度化に対応できる人材の育成が急務で、政府は教育機関や民間企業と連携した人材育成プログラムを拡充する方針。',
      },
    ],
    popular: [
      {
        title: '全国的に桜が見頃 今週末が最後のお花見チャンス',
        url: '#',
        source: 'NHK',
        publishedAt: '2026-04-12 06:00',
        summary: '気象庁によると、関東から近畿にかけて桜が満開を迎えており、今週末が今年最後の見頃となる見通し。東京の上野公園や大阪の造幣局では多くの花見客で賑わっている。来週以降は気温の上昇に伴い散り始める地域が増える見込み。',
      },
      {
        title: '大谷翔平、今季10号ホームラン 打率.320をキープ',
        url: '#',
        source: 'スポーツニッポン',
        publishedAt: '2026-04-12 05:30',
        summary: 'ドジャースの大谷翔平選手が現地時間11日の試合で今季10号ホームランを放った。打率は.320をキープし、リーグトップクラスの成績を維持。試合後のインタビューでは「チームの勝利に貢献できてよかった」とコメントした。',
      },
      {
        title: '新型コロナ、5類移行後初の大規模調査 抗体保有率は85%',
        url: '#',
        source: '毎日新聞',
        publishedAt: '2026-04-11 20:00',
        summary: '厚生労働省が実施した全国規模の抗体調査で、新型コロナウイルスに対する抗体保有率が約85%に達していることが判明した。ワクチン接種と自然感染の両方の影響とみられ、専門家は「集団免疫に近い状態」と評価しつつも、高齢者への追加接種の重要性を強調している。',
      },
      {
        title: '話題の映画「星降る夜に」が興行収入100億円突破',
        url: '#',
        source: 'オリコン',
        publishedAt: '2026-04-11 17:00',
        summary: '公開から6週目を迎えたアニメ映画「星降る夜に」の累計興行収入が100億円を突破した。海外でも高い評価を受けており、北米での公開が来月に控えている。監督は「日本のアニメーションが世界で評価されていることを嬉しく思う」とコメント。',
      },
      {
        title: '全国の人気カフェランキング2026 1位は京都の隠れ家カフェ',
        url: '#',
        source: '食べログ',
        publishedAt: '2026-04-11 12:00',
        summary: 'グルメサイトが発表した2026年版の人気カフェランキングで、京都・東山エリアの隠れ家カフェ「茶寮 月光」が1位に選ばれた。築100年の町家を改装した空間と、自家焙煎コーヒーが評価された。2位は東京・蔵前のスペシャルティコーヒー店が選出。',
      },
    ],
  };

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockNews[category] || []);
    }, 200);
  });
}
