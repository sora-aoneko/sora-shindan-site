(function () {
  var S = Sora, state = S.loadState() || {};
  var box = document.getElementById('themes');
  box.innerHTML = S.THEMES.map(function (t, i) {
    return '<label class="opt" for="th' + i + '"><input type="radio" name="theme" id="th' + i + '" value="' + S.esc(t.key) + '"' +
      (state.theme === t.key ? ' checked' : '') + '><span>' + S.esc(t.label) + '</span></label>';
  }).join('');
  if (state.name) document.getElementById('name').value = state.name;
  if (state.birthday) document.getElementById('birthday').value = state.birthday;

  function sync() {
    Array.prototype.forEach.call(box.querySelectorAll('.opt'), function (l) { l.classList.toggle('sel', l.querySelector('input').checked); });
  }
  box.addEventListener('change', function () { sync(); setErr('theme-err', ''); });
  sync();

  function setErr(id, msg, inputId) {
    document.getElementById(id).textContent = msg;
    if (inputId) document.getElementById(inputId).classList.toggle('bad', !!msg);
  }

  document.getElementById('form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('name').value.trim();
    var bd = document.getElementById('birthday').value;
    var chk = box.querySelector('input:checked');
    var p = S.parseYmd(bd);
    var eN = name ? '' : 'お名前を入力してください。ニックネームでもだいじょうぶです。';
    var eB = !bd ? '生年月日を入力してください。' : !p ? '日付の形式をご確認ください。' :
      (p.y < 1950 || p.y > 2015) ? '1950〜2015年生まれの方が対象です。' :
      S.signIndexFromBirthday(bd) < 0 ? '星座を調べられませんでした。日付をご確認ください。' : '';
    var eT = chk ? '' : 'いま気になっていることを、ひとつ選んでください。';
    setErr('name-err', eN, 'name'); setErr('birth-err', eB, 'birthday'); setErr('theme-err', eT);
    if (eN) return document.getElementById('name').focus();
    if (eB) return document.getElementById('birthday').focus();
    if (eT) return box.querySelector('input').focus();
    var idx = S.signIndexFromBirthday(bd);
    S.saveState({ name: name, birthday: bd, theme: chk.value, signIndex: idx, sign: S.signName(idx), doneAt: new Date().toISOString() });
    location.href = 'result.html';
  });
})();
