/* 公式LINEのつなぎ設定（ここだけ直せばよい）
   - LINE_URL: 公式LINEの友だち追加URL。
   - 診断コード: 「S（星座番号2桁）-（テーマ3文字）」。例: 牡羊座×恋愛 = S01-REN
     line/messages.md の見出し（## S01-REN）と一致します。 */
(function () {
  var LINE_URL = 'https://lin.ee/psuZKW3';
  var THEME_CODE = { '恋愛': 'REN', '仕事': 'WRK', 'お金': 'MNY', '人間関係': 'REL', '自分らしさ': 'SLF', '休息': 'RST', '転機': 'CHG', '学び': 'LRN' };
  function makeCode(signIndex, theme) {
    return 'S' + ('0' + (signIndex + 1)).slice(-2) + '-' + THEME_CODE[theme];
  }
  var SITE_ORIGIN = 'https://sora-aoneko.github.io/sora-shindan-site';
  var SHARE_TAG = '#そら診断';
  window.SORA_CONFIG = { LINE_URL: LINE_URL, SHARE_TAG: SHARE_TAG, SITE_ORIGIN: SITE_ORIGIN, THEME_CODE: THEME_CODE, makeCode: makeCode };
})();
