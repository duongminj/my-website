// Helpers: apply numeric-only behavior to inputs
function makeNumberOnly(input) {
    if (!input) return;
    input.addEventListener('input', () => {
        input.value = input.value.replace(/[^0-9\-\.]/g,''); // allow digits, minus and dot if needed
    });
    input.addEventListener('paste', e => e.preventDefault());
}

// Initialize existing inputs and set up handlers
document.addEventListener('DOMContentLoaded', () => {
    // Apply number-only to all current inputs with the class
    document.querySelectorAll('.number-only').forEach(makeNumberOnly);

    // Existing button that adds an empty column
    const themBtn = document.getElementById('themCot');
    if (themBtn) themBtn.addEventListener('click', addEmptyColumn);

    // Sidebar button to add a column with provided values
    const addFromSidebarBtn = document.getElementById('addFromSidebar');
    if (addFromSidebarBtn) addFromSidebarBtn.addEventListener('click', addColumnFromSidebar);
});

function addEmptyColumn() {
    const table = document.querySelector('table');
    const rows = table.rows; // trả về HTMLCollection của tất cả hàng
    const colCount = rows[0].cells.length;

    const newCell1 = rows[0].insertCell(colCount);
    newCell1.innerHTML = `[ <input type="text" class="number-only" placeholder="số" data-name="m${colCount+1}_1"> ; <input type="text" class="number-only" placeholder="số" data-name="m${colCount+1}_2"> )`;

    const newCell2 = rows[1].insertCell(colCount);
    newCell2.innerHTML = `<input type="text" class="number-only" placeholder="số" data-name="f${colCount}">`;

    newCell1.querySelectorAll('.number-only').forEach(makeNumberOnly);
    newCell2.querySelectorAll('.number-only').forEach(makeNumberOnly);
}

// Add a new column using values from the sidebar form
function addColumnFromSidebar() {
    const a = document.getElementById('sampleMin').value.trim();
    const b = document.getElementById('sampleMax').value.trim();
    const f = document.getElementById('freq').value.trim();

    if (a === '' || b === '' || f === '') {
        alert('Vui lòng nhập đầy đủ: mẫu số (a và b) và tần suất.');
        return;
    }

    // Optionally validate numbers
    if (isNaN(Number(a)) || isNaN(Number(b)) || isNaN(Number(f))) {
        alert('Các ô phải là số hợp lệ.');
        return;
    }

    const table = document.querySelector('table');
    const rows = table.rows;
    const colCount = rows[0].cells.length;

    // Insert cells
    const newCell1 = rows[0].insertCell(colCount);
    // Put the values into read-only inputs so user can still edit if needed
    newCell1.innerHTML = `[ <input type="text" class="number-only" value="${escapeHtml(a)}" data-name="m${colCount+1}_1"> ; <input type="text" class="number-only" value="${escapeHtml(b)}" data-name="m${colCount+1}_2"> )`;

    const newCell2 = rows[1].insertCell(colCount);
    newCell2.innerHTML = `<input type="text" class="number-only" value="${escapeHtml(f)}" data-name="f${colCount}">`;

    // Apply numeric constraint
    newCell1.querySelectorAll('.number-only').forEach(makeNumberOnly);
    newCell2.querySelectorAll('.number-only').forEach(makeNumberOnly);

    // Clear sidebar inputs for convenience
    document.getElementById('sampleMin').value = '';
    document.getElementById('sampleMax').value = '';
    document.getElementById('freq').value = '';
}

// simple HTML escape for values placed into value="..."
function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Compute grouped statistics and display under the confirm button
function xacNhan() {
    const table = document.querySelector('table');
    if (!table) return;

    const rowIntervals = table.rows[0];
    const rowFreqs = table.rows[1];

    const classes = [];
    // data columns start from index 1 (index 0 is the header TH)
    for (let i = 1; i < rowIntervals.cells.length; i++) {
        const intervalInputs = rowIntervals.cells[i].querySelectorAll('input');
        const freqInput = rowFreqs.cells[i] ? rowFreqs.cells[i].querySelector('input') : null;

        const a = intervalInputs[0] ? intervalInputs[0].value.trim() : '';
        const b = intervalInputs[1] ? intervalInputs[1].value.trim() : '';
        const f = freqInput ? freqInput.value.trim() : '';

        // only include columns that have numeric values for all three fields
        const aN = parseFloat(a);
        const bN = parseFloat(b);
        const fN = parseFloat(f);
        if (!isNaN(aN) && !isNaN(bN) && !isNaN(fN)) {
            classes.push({a: aN, b: bN, f: fN});
        }
    }

    if (classes.length === 0) {
        document.getElementById('ketqua').textContent = 'Không có dữ liệu hợp lệ.';
        return;
    }

    // totals
    const n = classes.reduce((s, c) => s + c.f, 0);
    if (n === 0) {
        document.getElementById('ketqua').textContent = 'Tổng tần số (n) = 0, không thể tính.';
        return;
    }

    // mean using class midpoints
    let sum_fx = 0;
    classes.forEach(c => {
        const xm = (c.a + c.b) / 2;
        c.xm = xm;
        sum_fx += c.f * xm;
    });
    const mean = sum_fx / n;

    // cumulative frequencies
    let cf = 0;
    classes.forEach(c => { c.cf_before = cf; cf += c.f; c.cf = cf; });

    function groupedQuantile(pos) {
        // pos is position (e.g., n/2 for median, n/4 for Q1)
        for (let i = 0; i < classes.length; i++) {
            const c = classes[i];
            if (c.cf >= pos) {
                const L = c.a;
                const cf_prev = c.cf_before;
                const fm = c.f;
                const h = c.b - c.a;
                if (fm === 0) return (c.a + c.b) / 2; // fallback
                const q = L + ((pos - cf_prev) / fm) * h;
                return q;
            }
        }
        // if pos beyond last, return last class midpoint
        const last = classes[classes.length - 1];
        return (last.a + last.b) / 2;
    }

    const median = groupedQuantile(n / 2);
    const Q1 = groupedQuantile(n / 4);
    const Q3 = groupedQuantile(3 * n / 4);

    // mode (grouped) using formula
    let modalIndex = 0;
    for (let i = 1; i < classes.length; i++) {
        if (classes[i].f > classes[modalIndex].f) modalIndex = i;
    }
    const cm = classes[modalIndex];
    const f1 = cm.f;
    const f0 = modalIndex - 1 >= 0 ? classes[modalIndex - 1].f : 0;
    const f2 = modalIndex + 1 < classes.length ? classes[modalIndex + 1].f : 0;
    const hmo = cm.b - cm.a;
    let mode;
    const denom = 2 * f1 - f0 - f2;
    if (denom === 0) {
        mode = (cm.a + cm.b) / 2; // fallback to midpoint
    } else {
        mode = cm.a + ((f1 - f0) / denom) * hmo;
    }

    // format numbers
    function fmt(x) {
        return Number.isFinite(x) ? (+x).toFixed(3).replace(/\.000$/,'') : '-';
    }

    const out = [];
    out.push('Tổng tần số (n): ' + n);
    out.push('Số trung bình (X): ' + fmt(mean));
    out.push('Trung vị (median): ' + fmt(median));
    out.push('Mốt (Mo): ' + fmt(mode));
    out.push('Q1: ' + fmt(Q1));
    out.push('Q2 (median): ' + fmt(median));
    out.push('Q3: ' + fmt(Q3));

    document.getElementById('ketqua').innerHTML = out.join('<br>');
}