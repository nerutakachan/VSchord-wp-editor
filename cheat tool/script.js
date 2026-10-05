// 1. 日付初期設定 (split('T') に修正)
document.getElementById('datePosted').value = new Date().toISOString().split('T');

// HTMLエスケープ処理
function escapeHtml(str) {
	if (!str) return '';
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

// 2. JSON生成機能 (入力検証 & 型変換 & 空プロパティ除外)
function generateJSONLD() {
	const title = document.getElementById('title').value.trim();
	const companyName = document.getElementById('companyName').value.trim();
	const companyUrl = document.getElementById('companyUrl').value.trim();
	const logoUrl = document.getElementById('logoUrl').value.trim();
	const employmentType = document.getElementById('employmentType').value;
	const unitText = document.getElementById('unitText').value;
	const minText = document.getElementById('minValue').value.trim();
	const maxText = document.getElementById('maxValue').value.trim();
	const postalCode = document.getElementById('postalCode').value.trim();
	const addressRegion = document.getElementById('addressRegion').value.trim();
	const addressLocality = document.getElementById('addressLocality').value.trim();
	const streetAddress = document.getElementById('streetAddress').value.trim();
	const datePosted = document.getElementById('datePosted').value;
	const validThrough = document.getElementById('validThrough').value;
	const description = document.getElementById('description').value.trim();

	// 必須項目チェック
	if (!title || !companyName || !description || !datePosted || !addressRegion || !addressLocality || !streetAddress) {
		alert('必須項目（求人タイトル、会社名、仕事内容、掲載開始日、都道府県、市区町村、町名・番地）を入力してください。');
		return;
	}

	// 給与数値の検証
	const minValue = minText === '' ? null : Number(minText);
	const maxValue = maxText === '' ? null : Number(maxText);

	if (minValue === null && maxValue === null) {
		alert('給与情報（給与下限または給与上限）を入力してください。');
		return;
	}
	if ((minValue !== null && !Number.isFinite(minValue)) || (maxValue !== null && !Number.isFinite(maxValue))) {
		alert('給与には正しい数値を入力してください。');
		return;
	}
	if ((minValue !== null && minValue < 0) || (maxValue !== null && maxValue < 0)) {
		alert('給与にマイナス値は入力できません。');
		return;
	}
	if (minValue !== null && maxValue !== null && minValue > maxValue) {
		alert('給与下限は給与上限以下に設定してください。');
		return;
	}

	// description の改行を <br> に変換しエスケープ
	const formattedDescription = escapeHtml(description).replace(/\r?\n/g, '<br>');

	// ベースのスキーマ構築
	const schema = {
		"@context": "https://schema.org/",
		"@type": "JobPosting",
		"title": title,
		"description": formattedDescription,
		"datePosted": datePosted,
		"employmentType": [employmentType],
		"hiringOrganization": {
			"@type": "Organization",
			"name": companyName
		},
		"jobLocation": {
			"@type": "Place",
			"address": {
				"@type": "PostalAddress",
				"addressCountry": "JP",
				"addressRegion": addressRegion,
				"addressLocality": addressLocality,
				"streetAddress": streetAddress
			}
		},
		"baseSalary": {
			"@type": "MonetaryAmount",
			"currency": "JPY",
			"value": {
				"@type": "QuantitativeValue",
				"unitText": unitText
			}
		}
	};

	// 数値型の給与設定（単一給与は value、範囲は minValue/maxValue）
	if (minValue !== null && maxValue !== null && minValue === maxValue) {
		schema.baseSalary.value.value = minValue;
	} else {
		if (minValue !== null) schema.baseSalary.value.minValue = minValue;
		if (maxValue !== null) schema.baseSalary.value.maxValue = maxValue;
	}

	// 郵便番号
	if (postalCode) {
		schema.jobLocation.address.postalCode = postalCode;
	}

	// 会社URL (sameAs) と ロゴ (logo) は入力がある場合のみ出力
	if (companyUrl) {
		schema.hiringOrganization.sameAs = companyUrl;
	}
	if (logoUrl) {
		schema.hiringOrganization.logo = logoUrl;
	}

	// 掲載期限 (validThrough) は設定がある場合のみ出力
	if (validThrough) {
		schema.validThrough = validThrough;
	}

	const jsonText = JSON.stringify(schema, null, 2);
	document.getElementById('jsonOutput').value = `<script type="application/ld+json">\n${jsonText}\n<\/script>`;
}

// 3. 既存JSON読み込み機能 (配列 / @graph / saveAsタイポ対応)
function importJSON() {
	let raw = document.getElementById('jsonInput').value.trim();
	if (!raw) return alert('JSONデータを入力してください。');

	// <script>タグの除去
	raw = raw.replace(/<script[^>]*>/gi, '').replace(/<\/script>/gi, '').trim();

	try {
		let parsed = JSON.parse(raw);
		
		// 配列や @graph の解析
		let data = parsed;
		if (Array.isArray(parsed)) {
			data = parsed.find(item => item['@type'] === 'JobPosting') || parsed;
		} else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
			data = parsed['@graph'].find(item => item['@type'] === 'JobPosting') || parsed['@graph'];
		}

		if (!data) return alert('有効な JobPosting データが見つかりませんでした。');

		if (data.title) document.getElementById('title').value = data.title;

		// description のHTMLタグ（<br>）を改行に戻す
		if (data.description) {
			document.getElementById('description').value = data.description
				.replace(/<br\s*\/?>/gi, '\n')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&#039;/g, "'")
				.replace(/&amp;/g, '&');
		}
		
		if (data.hiringOrganization) {
			if (data.hiringOrganization.name) document.getElementById('companyName').value = data.hiringOrganization.name;
			
			// sameAs / saveAs (タイポ救済) の読み込み
			const sameAsVal = data.hiringOrganization.sameAs || data.hiringOrganization.saveAs;
			if (sameAsVal) {
				document.getElementById('companyUrl').value = Array.isArray(sameAsVal) ? sameAsVal : sameAsVal;
			}
			if (data.hiringOrganization.logo) document.getElementById('logoUrl').value = data.hiringOrganization.logo;
		}

		// employmentType (配列・文字列対応)
		if (data.employmentType) {
			const emp = Array.isArray(data.employmentType) ? data.employmentType : data.employmentType;
			if (emp) document.getElementById('employmentType').value = emp;
		}

		// 給与情報の読み込み (数値/文字列対応)
		if (data.baseSalary && data.baseSalary.value) {
			const val = data.baseSalary.value;
			if (val.unitText) document.getElementById('unitText').value = val.unitText;
			if (val.minValue !== undefined) document.getElementById('minValue').value = val.minValue;
			if (val.maxValue !== undefined) document.getElementById('maxValue').value = val.maxValue;
			if (val.value !== undefined && val.minValue === undefined) {
				document.getElementById('minValue').value = val.value;
				document.getElementById('maxValue').value = val.value;
			}
		}

		if (data.jobLocation && data.jobLocation.address) {
			const addr = data.jobLocation.address;
			if (addr.postalCode) document.getElementById('postalCode').value = addr.postalCode;
			if (addr.addressRegion) document.getElementById('addressRegion').value = addr.addressRegion;
			if (addr.addressLocality) document.getElementById('addressLocality').value = addr.addressLocality;
			if (addr.streetAddress) document.getElementById('streetAddress').value = addr.streetAddress;
		}

		if (data.datePosted) document.getElementById('datePosted').value = data.datePosted;
		if (data.validThrough) document.getElementById('validThrough').value = data.validThrough;

		alert('データを正常に読み込みました！');
		generateJSONLD();
	} catch(e) {
		alert('JSONの解析に失敗しました。正しい形式のJSONデータかご確認ください。');
	}
}

// 4. フォームクリア機能
function clearForm() {
	document.getElementById('jobForm').reset();
	document.getElementById('datePosted').value = new Date().toISOString().split('T');
	document.getElementById('jsonOutput').value = '';
}

// 5. クリップボードコピー機能
function copyOutput() {
	const outputText = document.getElementById('jsonOutput');
	if (!outputText.value) return alert('生成されたテキストがありません。');
	outputText.select();
	document.execCommand('copy');
	alert('構造化データテキストをクリップボードにコピーしました！');
}

// アスペクト比計算用の最大公約数（GCD）計算関数
function getGCD(a, b) {
	return b === 0 ? a : getGCD(b, a % b);
}

// アスペクト比変換機能
function convertAspectRatio() {
	const widthInput = document.getElementById('aspectWidth').value;
	const heightInput = document.getElementById('aspectHeight').value;

	const width = Math.round(Number(widthInput));
	const height = Math.round(Number(heightInput));

	if (!widthInput || !heightInput || isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
		document.getElementById('aspectOutput').textContent = '';
		return;
	}
	const gcd = getGCD(width, height);
	let ratioW = width / gcd;
	let ratioH = height / gcd;

	while (ratioW >= 100 || ratioH >= 100) {
		ratioW = Math.round(ratioW / 10);
		ratioH = Math.round(ratioH / 10);
	}

	document.getElementById('aspectOutput').textContent = `.image-${ratioW}-${ratioH}{\n\taspect-ratio: ${ratioW} / ${ratioH};\n}`;
}