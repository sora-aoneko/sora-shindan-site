/* 共通ロジック: 太陽星座・結果文・今月の運気がいい日。
   データは site/data/*.js（scripts/build_data.py が uranai-db から生成）だけを使う。 */
(function () {
  var KEYS = { state: 'sora_shindan_state' };

  var THEMES = [
    { key: '恋愛', label: '気になる人や、恋人とのこと' },
    { key: '仕事', label: '仕事のやり方や、働き方のこと' },
    { key: 'お金', label: 'お金の使い方や、残し方のこと' },
    { key: '人間関係', label: '友だち・家族・職場の人との距離' },
    { key: '自分らしさ', label: '自分の「好き」や、大切にしたいこと' },
    { key: '休息', label: 'ちゃんと休めていない気がすること' },
    { key: '転機', label: '環境や暮らしを変えるか迷っていること' },
    { key: '学び', label: '勉強や習い事を始めたい・続けたいこと' }
  ];
  /* ---- 太陽星座（イングレス表から。日本時間の正午で判定） ---- */
  function parseYmd(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    var t = new Date(Date.UTC(y, mo - 1, d));
    if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
    return { y: y, m: mo, d: d };
  }
  function signIndexFromBirthday(s) {
    var p = parseYmd(s);
    if (!p || !window.SORA_INGRESS || !window.SORA_INGRESS[p.y]) return -1;
    var noon = (Date.UTC(p.y, p.m - 1, p.d, 12) - Date.UTC(p.y, 0, 1)) / 60000; // 年初(日本時間0時)からの分
    var list = window.SORA_INGRESS[p.y].slice().sort(function (a, b) { return a[1] - b[1]; });
    var cur = 9; // 年の最初の入りより前は、前年末に入った山羊座
    list.forEach(function (e) { if (e[1] <= noon) cur = e[0]; });
    return cur;
  }

  /* ---- 結果文（sign-*.md / planet-moon.md の文言だけ） ---- */
  function pick(arr, i) { return arr[i % arr.length]; }
  function themeIndex(theme) {
    return Math.max(0, THEMES.map(function (t) { return t.key; }).indexOf(theme));
  }
  function themeSection(sg, theme) {
    return theme === '恋愛' ? sg.love : theme === '仕事' ? sg.work : null;
  }
  function freeReading(signIdx, theme) {
    var sg = window.SORA_TEXTS.signs[signIdx];
    var k = themeIndex(theme);
    var sec = themeSection(sg, theme);
    var para, items = [];
    if (sec) {
      para = sec.slice(0, 3).join('');
      items.push(['気をつけたいこと', pick(sg.cautions, k)]);
    } else {
      para = sg.basic.slice(2).join('');
      items.push(['強み', pick(sg.strengths, k)]);
      items.push(['気をつけたいこと', pick(sg.cautions, k)]);
    }
    var wi = k; // テーマごとに行動のヒントを変える
    return {
      sign: sg.name,
      intro: sg.basic.slice(0, 2).join(''),
      para: para,
      items: items,
      todo: sg.hints[wi % sg.hints.length]
    };
  }
  function fullReading(signIdx, theme) {
    var sg = window.SORA_TEXTS.signs[signIdx];
    var sec = themeSection(sg, theme);
    return {
      sign: sg.name,
      basic: sg.basic.join(''),
      strengths: sg.strengths,
      cautions: sg.cautions,
      themeTitle: sec ? theme + 'について' : null,
      themeText: sec ? sec.join('') : null,
      hints: sg.hints
    };
  }

  /* ---- 今月の運気がいい日（月がその人の太陽星座に滞在する日） ---- */
  var WD = ['日', '月', '火', '水', '木', '金', '土'];
  function parseLocal(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s);
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  }
  function md(d) { return (d.getMonth() + 1) + '/' + d.getDate() + '(' + WD[d.getDay()] + ')'; }
  function hm(d) { return d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2); }
  function movableDays(signIdx) {
    var sg = window.SORA_TEXTS.signs[signIdx];
    var moon = window.SORA_TEXTS.moon;
    var out = [];
    ['2026-11', '2026-12'].forEach(function (mk) {
      var segs = (window.SORA_MOON[mk] || {})[sg.name] || [];
      var rows = segs.map(function (seg, i) {
        var a = parseLocal(seg[0]), b = parseLocal(seg[1]);
        var lastDay = new Date(b.getTime());
        if (b.getHours() === 0 && b.getMinutes() === 0) lastDay.setDate(lastDay.getDate() - 1);
        var startClip = a.getDate() === 1 && a.getHours() === 0 && a.getMinutes() === 0;
        var endClip = b.getHours() === 0 && b.getMinutes() === 0 && b.getDate() === 1;
        var range = md(a) === md(lastDay) ? md(a) : md(a) + ' 〜 ' + md(lastDay);
        var time = (startClip ? '月初から' : md(a) + ' ' + hm(a) + 'ごろから') + '、' +
          (endClip ? '月末まで' : md(b) + ' ' + hm(b) + 'ごろまで');
        return {
          range: range, time: time,
          line: sg.name + 'の強み：' + pick(sg.strengths, i),
          moonHint: '月のヒント：' + pick(moon.hints, i)
        };
      });
      out.push({ month: +mk.slice(5) + '月', rows: rows });
    });
    return { intro: moon.basic[0], months: out };
  }

  /* ---- 状態の保存 ---- */
  /* 入力はブラウザ内（sessionStorage）だけ。サーバには送らない。 */
  function loadState() { try { return JSON.parse(sessionStorage.getItem(KEYS.state)) || null; } catch (e) { return null; } }
  function saveState(s) { sessionStorage.setItem(KEYS.state, JSON.stringify(s)); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  window.Sora = {
    KEYS: KEYS, THEMES: THEMES,
    parseYmd: parseYmd, signIndexFromBirthday: signIndexFromBirthday,
    freeReading: freeReading, fullReading: fullReading, movableDays: movableDays,
    loadState: loadState, saveState: saveState, esc: esc,
    signName: function (i) { return window.SORA_TEXTS.signs[i].name; }
  };
})();
