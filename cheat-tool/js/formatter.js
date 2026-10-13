// 現在選択中の言語 ('html' | 'css' | 'js')
let currentLang = 'html';
// 言語切り替えタブ処理
function switchLang(lang, btnElement) {
	currentLang = lang;
	document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
	btnElement.classList.add('active');
	const labels = {
		html: 'HTML',
		css: 'CSS',
		js: 'JavaScript'
	};
	const labelElem = document.getElementById('inputLabel');
	if (labelElem) {
		labelElem.textContent = `${labels[lang]}コードを入力:`;
	}
}
// インデントタイプ変更時にインデントサイズ選択肢の表示/非表示を制御
function toggleIndentSize() {
	const indentTypeSelect = document.getElementById('indentType');
	const wrapper = document.getElementById('indentSizeWrapper');
	if (indentTypeSelect && wrapper) {
		wrapper.style.display = (indentTypeSelect.value === 'tab') ? 'none' : 'block';
	}
}
// コード整形メイン関数（js-beautify ライブラリを使用）
// コード整形メイン関数
function formatCode() {
	const rawInput = document.getElementById('inputHtml') || document.getElementById('rawCode');
	const outputTarget = document.getElementById('outputHtml') || document.getElementById('formattedCode');
	if (!rawInput || !outputTarget) return;
	const raw = rawInput.value;
	if (!raw.trim()) {
		alert('コードを入力してください。');
		return;
	}
	const indentTypeSelect = document.getElementById('indentType');
	const indentSizeSelect = document.getElementById('indentSize');
	const preserveCheck = document.getElementById('preserveNewlines');
	const removeEmptyLinesCheck = document.getElementById('removeEmptyLines'); // 空行除去チェックボックス
	const indentType = indentTypeSelect ? indentTypeSelect.value : 'space';
	const indentSizeVal = indentSizeSelect ? parseInt(indentSizeSelect.value, 10) : 4;
	const preserveNewlines = preserveCheck ? preserveCheck.checked : false;
	const removeEmptyLines = removeEmptyLinesCheck ? removeEmptyLinesCheck.checked : false;
	// js-beautify オプション設定
	const options = {
		indent_size: indentType === 'tab' ? 1 : indentSizeVal,
		indent_char: indentType === 'tab' ? '\t' : ' ',
		// 空行を無くす場合は改行保持をOFFにし、CSSルール間の空行(newline_between_rules)も無効化
		max_preserve_newlines: removeEmptyLines ? 0 : (preserveNewlines ? 10 : 0),
		preserve_newlines: removeEmptyLines ? false : preserveNewlines,
		newline_between_rules: !removeEmptyLines,
		indent_inner_html: true,
		extra_liners: [],
		end_with_newline: false
	};
	let formatted = '';
	try {
		if (currentLang === 'html') {
			if (typeof html_beautify === 'function') {
				formatted = html_beautify(raw, options);
			} else {
				formatted = fallbackFormatHTML(raw, options);
			}
		} else if (currentLang === 'css') {
			if (typeof css_beautify === 'function') {
				formatted = css_beautify(raw, options);
			} else {
				formatted = fallbackFormatCSS(raw, options);
			}
		} else if (currentLang === 'js') {
			if (typeof js_beautify === 'function') {
				formatted = js_beautify(raw, options);
			} else {
				formatted = fallbackFormatJS(raw, options);
			}
		}
	} catch (e) {
		console.error('Formatting error:', e);
		alert('コードの整形中にエラーが発生しました。');
		return;
	}
	outputTarget.value = formatted;
}
// CDNが読み込めなかった場合のフォールバック用簡易整形ロジック
function fallbackFormatHTML(html, opts) {
	const indentStr = opts.indent_char.repeat(opts.indent_size);
	let indent = 0;
	let result = '';
	const tokens = html.replace(/>\s*</g, '>\n<').split('\n');
	tokens.forEach(token => {
		let trimmed = token.trim();
		if (!trimmed) {
			if (opts.preserve_newlines) result += '\n';
			return;
		}
		if (trimmed.match(/^<\//)) indent = Math.max(0, indent - 1);
		result += indentStr.repeat(indent) + trimmed + '\n';
		if (trimmed.match(/^<[^/]/) && !trimmed.match(/\/>\$/) && !trimmed.match(/^<(meta|link|img|br|hr|input)/i)) {
			indent++;
		}
	});
	return result.trim();
}

function fallbackFormatCSS(css, opts) {
	const indentStr = opts.indent_char.repeat(opts.indent_size);
	let cleaned = css.replace(/\s*{\s*/g, ' {\n').replace(/;\s*/g, ';\n').replace(/\s*}\s*/g, '\n}\n');
	let lines = cleaned.split('\n');
	let result = '';
	let indent = 0;
	lines.forEach(line => {
		let trimmed = line.trim();
		if (!trimmed) {
			if (opts.preserve_newlines) result += '\n';
			return;
		}
		if (trimmed.startsWith('}')) indent = Math.max(0, indent - 1);
		result += indentStr.repeat(indent) + trimmed + '\n';
		if (trimmed.endsWith('{')) indent++;
	});
	return result.trim();
}

function fallbackFormatJS(js, opts) {
	const indentStr = opts.indent_char.repeat(opts.indent_size);
	let indent = 0;
	let result = '';
	let lines = js.split('\n');
	lines.forEach(line => {
		let trimmed = line.trim();
		if (!trimmed) {
			if (opts.preserve_newlines) result += '\n';
			return;
		}
		if (trimmed.startsWith('}') || trimmed.startsWith(']')) indent = Math.max(0, indent - 1);
		result += indentStr.repeat(indent) + trimmed + '\n';
		if (trimmed.endsWith('{') || trimmed.endsWith('[')) indent++;
	});
	return result.trim();
}
// クリップボードコピー機能
function copyCode() {
	const outputTarget = document.getElementById('outputHtml') || document.getElementById('formattedCode');
	if (!outputTarget || !outputTarget.value) {
		alert('コピーするコードがありません。');
		return;
	}
	outputTarget.select();
	if (navigator.clipboard && window.isSecureContext) {
		navigator.clipboard.writeText(outputTarget.value).then(() => {
			showPopup();
		}).catch(() => {
			document.execCommand('copy');
			showPopup();
		});
	} else {
		document.execCommand('copy');
		showPopup();
	}
}
// ポップアップ表示機能
function showPopup() {
	const popup = document.getElementById('popupMessage');
	if (popup) {
		popup.classList.remove('hidden');
		setTimeout(() => {
			popup.classList.add('hidden');
		}, 2000);
	}
}
// クリア機能
function clearCode() {
	const rawInput = document.getElementById('inputHtml') || document.getElementById('rawCode');
	const outputTarget = document.getElementById('outputHtml') || document.getElementById('formattedCode');
	if (rawInput) rawInput.value = '';
	if (outputTarget) outputTarget.value = '';
}