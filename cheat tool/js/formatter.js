// 現在選択中の言語 ('html' | 'css' | 'js')
let currentLang = 'html';

// 言語切り替え
function switchLang(lang, btnElement) {
  currentLang = lang;

  // タブのactive切り替え
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');

  // ラベルテキスト更新
  const labels = { html: 'HTML', css: 'CSS', js: 'JavaScript' };
  document.getElementById('inputLabel').textContent = `${labels[lang]}コードを入力`;
}

// コード整頓実行
function formatCode() {
  const raw = document.getElementById('rawCode').value;
  if (!raw.trim()) {
    alert('コードを入力してください。');
    return;
  }

  let formatted = '';
  if (currentLang === 'html') {
    formatted = formatHTML(raw);
  } else if (currentLang === 'css') {
    formatted = formatCSS(raw);
  } else if (currentLang === 'js') {
    formatted = formatJS(raw);
  }

  document.getElementById('formattedCode').value = formatted;
}

// 簡単なHTML整形ロジック
function formatHTML(html) {
  let indent = 0;
  const tab = '  ';
  let result = '';
  const tokens = html.replace(/>\s*</g, '>\n<').split('\n');

  tokens.forEach(token => {
    token = token.trim();
    if (!token) return;

    // 閉じタグの場合はインデントを減らす
    if (token.match(/^<\//)) {
      indent = Math.max(0, indent - 1);
    }

    result += tab.repeat(indent) + token + '\n';

    // 開始タグ（自閉タグや<!DOCTYPE>等を除く）の場合はインデントを増やす
    if (token.match(/^<[^\/]/) && !token.match(/\/>\$/) && !token.match(/^<(meta|link|img|br|hr|input)/i)) {
      indent++;
    }
  });

  return result.trim();
}

// 簡単なCSS整形ロジック
function formatCSS(css) {
  return css
    .replace(/\s*\{\s*/g, ' {\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\s*\}\s*/g, '\n}\n\n')
    .replace(/\n  \}/g, '\n}')
    .trim();
}

// 簡単なJS整形ロジック
function formatJS(js) {
  // ブラウザ標準機能による簡易整形（またはインデント調整）
  let indent = 0;
  const tab = '  ';
  let result = '';
  const lines = js.split('\n');

  lines.forEach(line => {
    let trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('}') || trimmed.startsWith(']')) {
      indent = Math.max(0, indent - 1);
    }

    result += tab.repeat(indent) + trimmed + '\n';

    if (trimmed.endsWith('{') || trimmed.endsWith('[')) {
      indent++;
    }
  });

  return result.trim();
}

// コピー機能
function copyCode() {
  const output = document.getElementById('formattedCode');
  if (!output.value) {
    alert('コピーするコードがありません。');
    return;
  }
  output.select();
  document.execCommand('copy');
  alert('コピーしました！');
}

// クリア機能
function clearCode() {
  document.getElementById('rawCode').value = '';
  document.getElementById('formattedCode').value = '';
}