/* 結果シェア（Threads / X）と、シェア用カード画像（1200x630）。
   名前は一切使わない（プライバシーのため）。外部ライブラリなし。 */
(function () {
  var S = window.Sora, C = window.SORA_CONFIG || {};
  var TAG = C.SHARE_TAG || '#そら診断';
  var SITE = (C.SITE_ORIGIN || 'https://sora-aoneko.github.io/sora-shindan-site') + '/';
  var WD = ['日', '月', '火', '水', '木', '金', '土'];
  var MAX_TEXT = 140; // URLを除いた本文の目安（X向け）

  function parseLocal(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s);
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  }
  function md(d) { return (d.getMonth() + 1) + '/' + d.getDate() + '(' + WD[d.getDay()] + ')'; }
  function clip(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  /* 月が星座に滞在する期間を日付順にならべ、つながっているものは1つにまとめる */
  function moonRanges(signName, now) {
    var moon = window.SORA_MOON || {}, segs = [];
    Object.keys(moon).sort().forEach(function (mk) {
      ((moon[mk] || {})[signName] || []).forEach(function (sg) { segs.push([parseLocal(sg[0]), parseLocal(sg[1])]); });
    });
    segs.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [];
    segs.forEach(function (sg) {
      var last = merged[merged.length - 1];
      if (last && last[1].getTime() === sg[0].getTime()) last[1] = sg[1]; else merged.push([sg[0], sg[1]]);
    });
    return merged.filter(function (sg) { return sg[1].getTime() >= now.getTime(); }).map(function (sg) {
      var last = new Date(sg[1].getTime());
      if (last.getHours() === 0 && last.getMinutes() === 0) last.setDate(last.getDate() - 1);
      var range = md(sg[0]) === md(last) ? md(sg[0]) : md(sg[0]) + '〜' + md(last);
      return { range: range, ongoing: sg[0].getTime() <= now.getTime() };
    });
  }

  function buildModel(signIndex, theme, now) {
    now = now || new Date();
    var r = S.freeReading(signIndex, theme);
    var sg = window.SORA_TEXTS.signs[signIndex];
    var ranges = moonRanges(sg.name, now);
    var next = ranges[0] || null, after = ranges[1] || null;
    var todo = r.todo;
    var memo = sg.strengths[S.THEMES.map(function (t) { return t.key; }).indexOf(theme) % sg.strengths.length] || sg.strengths[0];
    var m = {
      sign: sg.name, todo: todo, next: next, after: after,
      label: next && next.ongoing ? 'いまの運気がいい日' : '次の運気がいい日',
      memo: sg.name + 'のそらメモ：' + memo, url: SITE, tag: TAG
    };
    m.text = buildText(m);
    return m;
  }

  function buildText(m) {
    function make(todo) {
      var head = 'そらの無料診断、私は' + m.sign + 'で' +
        (m.next ? '、' + (m.next.ongoing ? 'いまの' : '次の') + '運気がいい日は' + m.next.range + 'でした🐾' : 'した🐾');
      return head + '\n今日の小さな行動：' + todo + '\nあなたは？\n' + m.tag + '\n' + m.url;
    }
    var todo = m.todo, t = make(todo);
    // URLを除いた長さが目安を超えるときは、行動を短くする
    while (t.length - m.url.length > MAX_TEXT && todo.length > 6) { todo = clip(todo, todo.length - 3); t = make(todo); }
    return t;
  }

  /* ---------- カード画像 ---------- */
  var W = 1200, H = 630;
  var FONT = '"Noto Sans JP","Noto Sans CJK JP","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif';
  var SERIF = '"Noto Serif JP","Noto Serif CJK JP","Hiragino Mincho ProN","Yu Mincho",serif';

  function loadImg(src) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  /* 幅に収まるまで文字を小さくする */
  function fit(ctx, text, weight, size, family, maxW, minSize) {
    while (size > minSize) { ctx.font = weight + ' ' + size + 'px ' + family; if (ctx.measureText(text).width <= maxW) return size; size -= 2; }
    ctx.font = weight + ' ' + size + 'px ' + family; return size;
  }
  /* 折り返し（最大maxLines行、はみ出す分は…） */
  function wrap(ctx, text, maxW, maxLines) {
    var lines = [], cur = '', i, ch;
    for (i = 0; i < text.length; i++) {
      ch = text.charAt(i);
      if (ctx.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; } else cur += ch;
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      var l = lines[maxLines - 1];
      while (l && ctx.measureText(l + '…').width > maxW) l = l.slice(0, -1);
      lines[maxLines - 1] = l + '…';
    }
    return lines;
  }

  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([document.fonts.load('700 40px ' + FONT, 'そらの診断'), document.fonts.load('700 40px ' + SERIF, '星座')]).catch(function () {});
  }

  function makeCanvas(m) {
    return Promise.all([loadImg('assets/sora-sm.png'), fontsReady()]).then(function (a) {
      var img = a[0], cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      var ctx = cv.getContext('2d');
      // 夜空
      var g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#13408f'); g.addColorStop(1, '#071b48');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      var rg = ctx.createRadialGradient(950, 300, 20, 950, 300, 420);
      rg.addColorStop(0, 'rgba(120,170,255,.38)'); rg.addColorStop(1, 'rgba(120,170,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      var stars = [[90,40,2],[300,70,1.5],[560,30,2],[700,110,1.5],[860,50,2.5],[1100,70,2],[1150,260,1.5],[1120,520,2],[40,330,1.5],[640,600,2],[400,610,1.5],[780,560,1.5]];
      ctx.fillStyle = '#fff';
      stars.forEach(function (s) { ctx.beginPath(); ctx.arc(s[0], s[1], s[2], 0, 7); ctx.fill(); });
      // そら
      if (img) {
        var ih = 540, iw = ih * img.naturalWidth / img.naturalHeight, ix = 830, iy = H - ih - 20;
        ctx.save(); ctx.shadowColor = 'rgba(150,200,255,.9)'; ctx.shadowBlur = 40;
        ctx.drawImage(img, ix, iy, iw, ih); ctx.restore();
        ctx.drawImage(img, ix, iy, iw, ih);
      }
      var L = 64, MW = 700;
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      // ヘッダー
      ctx.fillStyle = '#e6c46d'; ctx.font = '700 34px ' + FONT; ctx.fillText('✦ そらの無料診断', L, 82);
      // 星座
      ctx.fillStyle = '#fff'; fit(ctx, m.sign, '700', 150, SERIF, MW, 80); ctx.fillText(m.sign, L, 232);
      var y = 232;
      if (m.next) {
        y += 56; ctx.fillStyle = '#cfe0ff'; ctx.font = '500 30px ' + FONT; ctx.fillText(m.label, L, y);
        y += 66; ctx.fillStyle = '#e6c46d'; fit(ctx, m.next.range, '700', 58, FONT, MW, 30); ctx.fillText(m.next.range, L, y);
      } else {
        y += 52; ctx.fillStyle = '#cfe0ff'; fit(ctx, m.memo, '500', 30, FONT, MW, 20); ctx.fillText(m.memo, L, y);
      }
      // 小さな行動
      var py = y + 28, ph = 134;
      rr(ctx, L, py, MW, ph, 22); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fill();
      ctx.fillStyle = '#a67c1a'; ctx.font = '700 22px ' + FONT; ctx.fillText('今日の小さな行動', L + 28, py + 38);
      ctx.fillStyle = '#14264f'; ctx.font = '700 30px ' + FONT;
      wrap(ctx, m.todo, MW - 56, 2).forEach(function (ln, i) { ctx.fillText(ln, L + 28, py + 78 + i * 38); });
      // フッター
      ctx.fillStyle = '#fff'; ctx.font = '700 30px ' + FONT; ctx.fillText('あなたは？  ' + m.tag, L, H - 56);
      ctx.fillStyle = '#9fb7e6'; ctx.font = '400 21px ' + FONT;
      ctx.fillText(m.url.replace(/^https?:\/\//, '').replace(/\/$/, ''), L, H - 24);
      return cv;
    });
  }

  function canvasBlob(cv) {
    return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/png'); });
  }

  /* ---------- 画面 ---------- */
  function html(st) {
    var esc = S.esc, m = buildModel(st.signIndex, st.theme);
    var cmp = '';
    if (m.after) cmp += '<li>ちなみに、その次の運気がいい日は <b>' + esc(m.after.range) + '</b></li>';
    cmp += '<li>' + esc(m.memo) + '</li>';
    return '<section class="card share-card" id="share-card" aria-labelledby="share-h">' +
      '<h2 id="share-h">結果をシェアする</h2>' +
      '<p class="note" style="margin-top:0">お名前は入りません。いっしょに「あなたは？」と聞いてみてくださいね🐾</p>' +
      '<div class="share-img"><img id="share-img" width="1200" height="630" alt="診断結果のシェア用カード" hidden>' +
      '<p class="note center" id="share-img-wait">カードを作っています…</p></div>' +
      '<div class="share-text" id="share-text">' + esc(m.text).replace(/\n/g, '<br>') + '</div>' +
      '<ul class="share-cmp" id="share-cmp">' + cmp + '</ul>' +
      '<div class="share-btns">' +
      '<a class="btn share-th" id="share-threads" href="https://www.threads.net/intent/post?text=' + encodeURIComponent(m.text) + '" target="_blank" rel="noopener noreferrer">Threadsでシェア</a>' +
      '<a class="btn share-x" id="share-x" href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(m.text) + '" target="_blank" rel="noopener noreferrer">Xでシェア</a>' +
      '<button type="button" class="btn sub" id="share-copy">文章をコピー</button>' +
      '<button type="button" class="btn sub" id="share-image" disabled>画像を保存・シェア</button>' +
      '</div><div class="note center" id="share-status" role="status" aria-live="polite"></div></section>';
  }

  function init(st) {
    var m = buildModel(st.signIndex, st.theme), blob = null, $ = function (id) { return document.getElementById(id); };
    var status = $('share-status');
    function say(t) { status.textContent = t; }

    $('share-copy').addEventListener('click', function () {
      var done = function (ok) { say(ok ? '文章をコピーしました。' : 'コピーできませんでした。文章を長押しして選んでください。'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(m.text).then(function () { done(true); }, function () { done(false); });
      else {
        var t = document.createElement('textarea'); t.value = m.text; document.body.appendChild(t); t.select();
        var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} document.body.removeChild(t); done(ok);
      }
    });

    $('share-image').addEventListener('click', function () {
      if (!blob) return;
      var file = null;
      try { file = new File([blob], 'sora-shindan.png', { type: 'image/png' }); } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        navigator.share({ files: [file], text: m.text }).then(function () {}, function (err) {
          if (err && err.name === 'AbortError') return;
          say('シェアできませんでした。画像を長押しして保存してください。');
        });
      } else {
        var a = document.createElement('a'), u = URL.createObjectURL(blob);
        a.href = u; a.download = 'sora-shindan.png'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
        say('画像を保存しました。投稿に添えてくださいね。');
      }
    });

    makeCanvas(m).then(function (cv) {
      $('share-img').src = cv.toDataURL('image/png');
      $('share-img').hidden = false; $('share-img-wait').hidden = true;
      return canvasBlob(cv);
    }).then(function (b) { blob = b; if (b) $('share-image').disabled = false; })
      .catch(function () { $('share-img-wait').textContent = 'カード画像は作れませんでした。文章のシェアはお使いいただけます。'; });
  }

  window.SoraShare = { html: html, init: init, buildModel: buildModel, makeCanvas: makeCanvas, buildText: buildText };
})();
