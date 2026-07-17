const EMPLOYEE_STORAGE_KEY = 'qrpoc.employeeCode';
const RESUME_DELAY_MS = 1800;

const resultEl = document.getElementById('result');
const employeeLabelEl = document.getElementById('employee-label');
const logoutBtnEl = document.getElementById('logout-btn');
const overlayEl = document.getElementById('scan-overlay');
const overlayIconEl = document.getElementById('scan-overlay-icon');
const overlayMessageEl = document.getElementById('scan-overlay-message');

let isProcessing = false;

function getEmployeeCode() {
  return localStorage.getItem(EMPLOYEE_STORAGE_KEY);
}

function setEmployeeCode(code) {
  localStorage.setItem(EMPLOYEE_STORAGE_KEY, code);
  renderEmployeeBadge();
}

function clearEmployeeCode() {
  localStorage.removeItem(EMPLOYEE_STORAGE_KEY);
  renderEmployeeBadge();
}

function renderEmployeeBadge() {
  const code = getEmployeeCode();
  if (code) {
    employeeLabelEl.textContent = `ログイン中: ${code}`;
    logoutBtnEl.style.display = 'inline-block';
  } else {
    employeeLabelEl.textContent = '社員QR未スキャン（最初に社員QRをスキャンしてください）';
    logoutBtnEl.style.display = 'none';
  }
}

function showResult(ok, message) {
  resultEl.textContent = message;
  resultEl.className = ok ? 'ok' : 'error';
}

function showOverlay(state, icon, message) {
  overlayEl.className = `scan-overlay ${state}`;
  overlayIconEl.textContent = icon;
  overlayMessageEl.textContent = message;
}

function hideOverlay() {
  overlayEl.className = 'scan-overlay hidden';
}

async function submitScan(qrRaw) {
  const employeeCode = getEmployeeCode();

  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeCode, qrRaw }),
  });
  const data = await res.json();

  if (!res.ok) {
    return { ok: false, message: data.message || 'エラーが発生しました' };
  }

  if (data.scanType === 'EMPLOYEE' && data.ok) {
    setEmployeeCode(data.employeeCode);
  }

  return { ok: data.ok, message: data.message };
}

async function onScanSuccess(decodedText) {
  if (isProcessing) return;
  isProcessing = true;

  scanner.pause(true);
  showOverlay('pending', '…', '処理中です');
  if (navigator.vibrate) navigator.vibrate(50);

  try {
    const { ok, message } = await submitScan(decodedText);
    showResult(ok, message);
    showOverlay(ok ? 'ok' : 'error', ok ? '✓' : '✕', message);
  } catch (err) {
    const message = `通信エラー: ${err.message}`;
    showResult(false, message);
    showOverlay('error', '✕', message);
  }

  setTimeout(() => {
    hideOverlay();
    isProcessing = false;
    scanner.resume();
  }, RESUME_DELAY_MS);
}

logoutBtnEl.addEventListener('click', () => {
  clearEmployeeCode();
  showResult(true, 'ログアウトしました。社員QRをスキャンしてください');
});

renderEmployeeBadge();

const scanner = new Html5QrcodeScanner(
  'reader',
  { fps: 10, qrbox: 250, videoConstraints: { facingMode: { ideal: 'environment' } } },
  false
);
scanner.render(onScanSuccess);
