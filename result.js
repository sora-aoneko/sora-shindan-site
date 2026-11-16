(function () {
  var S = Sora, esc = S.esc, C = window.SORA_CONFIG;
  var st = S.loadState();
  var main = document.getElementById('main');
  if (!st || st.signIndex == null || !st.theme || !st.name) { location.replace('shindan.html'); return; }
  var r = S.freeReading(st.signIndex, st.theme);
  var themeLabel = (S.THEMES.filter(function (t) { return t.key === st.theme; })[0] || {}).label || st.theme;
  var code = C.makeCode(st.signIndex, st.theme);

  main.innerHTML =
    '<section class="res-hero"><img src="assets/sora-sm.png" alt="そら">' +
    '<div class="bubble"><p style="margin:0" id="who">' + esc(st.name) + 'さん、診断おつかれさまでした。まずは、かんたんな結果をお届けしますね。</p></div></section>' +

    '<section class="card" id="sign-card"><span class="tag">' + esc(st.name) + 'さんの太陽星座</span>' +
    '<div class="sign-name" id="sign-name">' + esc(r.sign) + '<small>（' + esc(st.birthday.replace(/-/g, '/')) + '生まれ）</small></div>' +
    '<p id="sign-intro">' + esc(r.intro) + '</p></section>' +

    '<section class="card" id="reading-card"><span class="tag">気になること：' + esc(st.theme) + '</span>' +
    '<h2 style="margin-top:10px">' + esc(st.theme) + 'について、' + esc(r.sign) + 'の読み</h2>' +
    '<p class="note" style="margin-top:-4px">「' + esc(themeLabel) + '」ですね。</p>' +
    '<p id="reading">' + esc(r.para) + '</p>' +
    '<ul class="labelled">' + r.items.map(function (it) { return '<li><b>' + esc(it[0]) + '</b>' + esc(it[1]) + '</li>'; }).join('') + '</ul>' +
    '<div class="todo mt" id="todo"><b>今日できる小さな行動</b>' + esc(r.todo) + '</div></section>' +

    '<section class="card line-card" id="line-card"><h2>詳しい結果は公式LINEで受け取る</h2>' +
    '<p>ここまでは、かんたんな結果です。公式LINEでは、次の内容をお渡しします（無料）。</p>' +
    '<ul class="check" id="line-list">' +
    '<li><b>星座の詳しい読み</b>（性質・強み・注意点）</li>' +
    '<li><b>今月の運気がいい日</b>（日付つき）</li>' +
    '<li><b>選んだテーマ「' + esc(st.theme) + '」への、より具体的なヒントと行動の手がかり</b></li></ul>' +
    '<h3>受け取り方</h3>' +
    '<ol class="steps"><li><b>下のボタンから、公式LINEを友だち追加します</b></li>' +
    '<li><b>トークに、この診断コードを送ります</b><br>' + esc(st.name) + 'さん向けの詳しい結果が届きます。</li></ol>' +
    '<div class="codebox"><div class="note" style="margin:0">あなたの診断コード</div>' +
    '<div class="code" id="code" aria-label="診断コード">' + esc(code) + '</div>' +
    '<button type="button" class="btn sub" id="copy">コードをコピーする</button>' +
    '<div class="note" id="copied" role="status" aria-live="polite"></div></div>' +
    '<a class="btn line" id="line-btn" href="' + esc(C.LINE_URL) + '" target="_blank" rel="noopener">公式LINEで詳しい結果を受け取る</a>' +
    '</section>';

  document.getElementById('copy').addEventListener('click', function () {
    var done = function (ok) { document.getElementById('copied').textContent = ok ? 'コピーしました。' : 'コピーできませんでした。コードを長押しして選んでください。'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () { done(true); }, function () { done(false); });
    else {
      var t = document.createElement('textarea'); t.value = code; document.body.appendChild(t); t.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} document.body.removeChild(t); done(ok);
    }
  });
})();
