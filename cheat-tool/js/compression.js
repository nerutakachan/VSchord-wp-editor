// 単位切り替え時のデフォルト値連動
function changeCompUnit() {
    const unit = document.getElementById('compUnit').value;
    const stdInput = document.getElementById('stdVal');
    const limitInput = document.getElementById('limitVal');
    const diffInput = document.getElementById('diffLimit');

    if (unit === 'kpa') {
        stdInput.value = "1236";
        limitInput.value = "883";
        diffInput.value = "98";
    } else {
        stdInput.value = "12.6";
        limitInput.value = "9.0";
        diffInput.value = "1.0";
    }
    calcCompression();
}

// 圧縮圧力の計算・判定処理
function calcCompression() {
    const unit = document.getElementById('compUnit').value; // 'kg' または 'kpa'
    const unitLabel = unit === 'kpa' ? 'kPa' : 'kg/cm²';

    const limitVal = parseFloat(document.getElementById('limitVal').value);
    const diffLimit = parseFloat(document.getElementById('diffLimit').value);

    // 4気筒の値を取得
    const cylInputs = [
        document.getElementById('cyl1').value,
        document.getElementById('cyl2').value,
        document.getElementById('cyl3').value,
        document.getElementById('cyl4').value
    ];

    const outElem = document.getElementById('compressionOutput');

    // 1つでも未入力がある場合の案内
    if (cylInputs.some(val => val === '' || isNaN(parseFloat(val)))) {
        outElem.textContent = '4気筒すべてに数値（bar）を入力してください。';
        return;
    }

    const convertedValues = [];
    let allNormal = true;
    let lines = [];

    lines.push('【換算結果】');

    cylInputs.forEach((rawVal, idx) => {
        const barVal = parseFloat(rawVal);
        // bar からの換算 (1 bar = 1.01972 kg/cm² / 1 bar = 100 kPa)
        let convVal = unit === 'kpa' ? (barVal * 100) : (barVal * 1.01972);
        convVal = Math.round(convVal * 100) / 100;
        convertedValues.push(convVal);

        // 各気筒の限度値判定
        let status = '正常';
        if (!isNaN(limitVal) && convVal < limitVal) {
            status = '異常（限度未満）';
            allNormal = false;
        }

        lines.push(`#${idx + 1}: ${convVal.toFixed(2)} ${unitLabel} [ ${status} ]`);
    });

    lines.push('');
    lines.push('【気筒間圧力差】');

    const maxVal = Math.max(...convertedValues);
    const minVal = Math.min(...convertedValues);
    const diff = Math.round((maxVal - minVal) * 100) / 100;

    let diffStatus = '正常';
    if (!isNaN(diffLimit) && diff > diffLimit) {
        diffStatus = '異常（差過大）';
        allNormal = false;
    }

    lines.push(`最大差: ${diff.toFixed(2)} ${unitLabel} [ ${diffStatus} ]`);

    lines.push('');
    lines.push('【総合判定】');
    if (allNormal) {
        lines.push('良好');
    } else {
        lines.push('要点検');
    }

    outElem.textContent = lines.join('\n');
}