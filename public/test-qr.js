const qrGrid = document.getElementById('qr-grid');

function renderQr(text, caption) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();

  const item = document.createElement('div');
  item.className = 'qr-item';

  const imgWrapper = document.createElement('div');
  imgWrapper.innerHTML = qr.createImgTag(6, 8);
  item.appendChild(imgWrapper);

  const p = document.createElement('p');
  p.textContent = `${caption}\n${text}`;
  item.appendChild(p);

  qrGrid.prepend(item);
}

document.getElementById('employee-generate').addEventListener('click', () => {
  const value = document.getElementById('employee-input').value.trim();
  if (!value) return;
  renderQr(`EMP-${value}`, '社員QR');
});

document.getElementById('product-generate').addEventListener('click', () => {
  const value = document.getElementById('product-input').value.trim();
  if (!value) return;
  renderQr(`PROD-${value}`, '製品識別番号QR');
});

document.getElementById('proc-generate').addEventListener('click', () => {
  const product = document.getElementById('proc-product-input').value.trim();
  const type = document.getElementById('proc-type-select').value;
  if (!product) return;
  const labels = {
    S1_START: '作業工程1開始',
    S1_END: '作業工程1完了',
    S2_START: '作業工程2開始',
    S2_END: '作業工程2完了',
    ALL_END: '全工程完了',
  };
  renderQr(`PROC-${product}-${type}`, `工程QR(${labels[type]})`);
});
