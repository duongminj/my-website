// main.js

// Giới hạn ô nhập chỉ cho phép số, chặn dán ký tự khác
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.number-only');

    inputs.forEach(input => {
        // Khi người dùng gõ
        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^0-9]/g, '');
        });

        // Khi người dùng dán
        input.addEventListener('paste', e => {
            e.preventDefault();
        });
    });
});

document.getElementById('themCot').addEventListener('click', () => {
    const table = document.querySelector('table');
    const rows = table.rows; // trả về HTMLCollection của tất cả hàng

    // Lấy số cột hiện tại
    const colCount = rows[0].cells.length;

    // Thêm ô mới cho hàng Mẫu số
    const newCell1 = rows[0].insertCell(colCount); // thêm cuối hàng
    newCell1.innerHTML = `[ <input type="text" class="number-only" placeholder="số" data-name="m${colCount+1}_1"> ; 
                           <input type="text" class="number-only" placeholder="số" data-name="m${colCount+1}_2"> )`;

    // Thêm ô mới cho hàng Tần suất
    const newCell2 = rows[1].insertCell(colCount);
    newCell2.innerHTML = `<input type="text" class="number-only" placeholder="số" data-name="f${colCount}">`;

    // Áp dụng lại class number-only cho JS chặn chữ
    const newInputs = newCell1.querySelectorAll('.number-only');
    newInputs.forEach(input => {
        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^0-9]/g,'');
        });
        input.addEventListener('paste', e => e.preventDefault());
    });

    const newInputF = newCell2.querySelector('.number-only');
    newInputF.addEventListener('input', () => {
        newInputF.value = newInputF.value.replace(/[^0-9]/g,'');
    });
    newInputF.addEventListener('paste', e => e.preventDefault());
});