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
    const unit = document.getElementById('compUnit').value;
    const unitLabel = unit === 'kpa' ? 'kPa' : 'kg/cm²';

    const limitVal = parseFloat(document.getElementById('limitVal').value);
    const diffLimit = parseFloat(document.getElementById('diffLimit').value);

    const cylInputs = [
        document.getElementById('cyl1').value,
        document.getElementById('cyl2').value,
        document.getElementById('cyl3').value,
        document.getElementById('cyl4').value
    ];

    const outElem = document.getElementById('compressionOutput');

    // 未入力チェック
    if (cylInputs.some(val => val === '' || isNaN(parseFloat(val)))) {
        outElem.innerHTML = '各シリンダーの圧力（bar）を入力してください。';
        return;
    }

    const convertedValues = [];
    let allNormal = true;
    let html = '';

    html += '<div class="comp-title">【換算結果】</div>';

    cylInputs.forEach((rawVal, idx) => {
        const barVal = parseFloat(rawVal);
        let convVal = unit === 'kpa' ? (barVal * 100) : (barVal * 1.01972);
        convVal = Math.round(convVal * 100) / 100;
        convertedValues.push(convVal);

        let status = '正常';
        let statusClass = '';
        if (!isNaN(limitVal) && convVal < limitVal) {
            status = '異常（限度未満）';
            statusClass = 'comp-ng';
            allNormal = false;
        }

        html += `<div class="comp-row">
                    <span>#${idx + 1}: ${convVal.toFixed(2)} ${unitLabel}</span>
                    <span class="${statusClass}">[ ${status} ]</span>
                 </div>`;
    });

    html += '<div class="comp-title">【気筒間圧力差】</div>';

    const maxVal = Math.max(...convertedValues);
    const minVal = Math.min(...convertedValues);
    const diff = Math.round((maxVal - minVal) * 100) / 100;

    let diffStatus = '正常';
    let diffClass = '';
    if (!isNaN(diffLimit) && diff > diffLimit) {
        diffStatus = '異常';
        diffClass = 'comp-ng';
        allNormal = false;
    }

    html += `<div class="comp-row">
                <span>最大差: ${diff.toFixed(2)} ${unitLabel}</span>
                <span class="${diffClass}">[ ${diffStatus} ]</span>
             </div>`;

    html += '<div class="comp-title">【総合判定】</div>';
    if (allNormal) {
        html += '<div>良好</div>';
    } else {
        html += '<div class="comp-ng">要点検</div>';
    }

    outElem.innerHTML = html;
}
// Enterキー（確定）で次の気筒へ自動ジャンプ
document.addEventListener('DOMContentLoaded', () => {
    const cylIds = ['cyl1', 'cyl2', 'cyl3', 'cyl4'];
    cylIds.forEach((id, index) => {
        const elem = document.getElementById(id);
        if (!elem) return;
        elem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (index < cylIds.length - 1) {
                    // 次の気筒へカーソルを移動
                    const nextElem = document.getElementById(cylIds[index + 1]);
                    if (nextElem) nextElem.focus();
                } else {
                    // 最後の#4ならキーボードを閉じる
                    elem.blur();
                }
            }
        });
    });
});