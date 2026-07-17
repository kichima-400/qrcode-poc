const express = require('express');
const db = require('../db');
const { parseQr } = require('../lib/qrParser');
const { nextExpectedType, statusAfter } = require('../lib/stateMachine');

const router = express.Router();

const insertLog = db.prepare(`
  INSERT INTO scan_logs
    (employee_code, product_code, scan_type, raw_qr, expected_scan_type, is_error, error_message)
  VALUES
    (@employeeCode, @productCode, @scanType, @rawQr, @expectedScanType, @isError, @errorMessage)
`);

const getSession = db.prepare('SELECT * FROM work_sessions WHERE product_code = ?');

const upsertSession = db.prepare(`
  INSERT INTO work_sessions (product_code, current_employee, status, started_at, updated_at)
  VALUES (@productCode, @employeeCode, @status, datetime('now', 'localtime'), datetime('now', 'localtime'))
  ON CONFLICT(product_code) DO UPDATE SET
    current_employee = @employeeCode,
    status = @status,
    started_at = datetime('now', 'localtime'),
    updated_at = datetime('now', 'localtime')
`);

const updateSessionStatus = db.prepare(`
  UPDATE work_sessions
  SET status = @status, current_employee = @employeeCode, updated_at = datetime('now', 'localtime')
  WHERE product_code = @productCode
`);

function logAndRespond(res, { employeeCode, productCode, scanType, rawQr, expectedScanType, isError, errorMessage, extra }) {
  insertLog.run({
    employeeCode,
    productCode: productCode ?? null,
    scanType,
    rawQr,
    expectedScanType: expectedScanType ?? null,
    isError: isError ? 1 : 0,
    errorMessage: errorMessage ?? null,
  });

  return res.json({
    ok: !isError,
    scanType,
    productCode: productCode ?? null,
    expected: expectedScanType ?? null,
    message: errorMessage ?? '記録しました',
    ...extra,
  });
}

router.post('/', (req, res) => {
  const { employeeCode, qrRaw } = req.body ?? {};

  if (typeof qrRaw !== 'string' || qrRaw.length === 0) {
    return res.status(400).json({ ok: false, message: 'qrRawは必須です' });
  }

  const { scanType, productCode, employeeCode: parsedEmployeeCode } = parseQr(qrRaw);

  if (scanType !== 'EMPLOYEE' && (typeof employeeCode !== 'string' || employeeCode.length === 0)) {
    return res.status(400).json({ ok: false, message: 'employeeCodeは必須です（先に社員QRをスキャンしてください）' });
  }

  if (scanType === 'UNKNOWN') {
    return logAndRespond(res, {
      employeeCode,
      productCode: null,
      scanType,
      rawQr: qrRaw,
      isError: true,
      errorMessage: '認識できないQRコードです',
    });
  }

  if (scanType === 'EMPLOYEE') {
    return logAndRespond(res, {
      employeeCode: parsedEmployeeCode,
      productCode: null,
      scanType,
      rawQr: qrRaw,
      isError: false,
      extra: { employeeCode: parsedEmployeeCode },
    });
  }

  if (scanType === 'PRODUCT') {
    const session = getSession.get(productCode);
    if (!session || session.status === 'ALL_DONE') {
      upsertSession.run({ productCode, employeeCode, status: 'PRODUCT_SCANNED' });
    } else {
      updateSessionStatus.run({ productCode, employeeCode, status: session.status });
    }
    return logAndRespond(res, {
      employeeCode,
      productCode,
      scanType,
      rawQr: qrRaw,
      isError: false,
      extra: { status: 'PRODUCT_SCANNED' },
    });
  }

  // 工程QR（S1_START, S1_END, S2_START, S2_END, ALL_END）
  const session = getSession.get(productCode);
  if (!session || session.status === 'ALL_DONE') {
    return logAndRespond(res, {
      employeeCode,
      productCode,
      scanType,
      rawQr: qrRaw,
      expectedScanType: 'PRODUCT',
      isError: true,
      errorMessage: '先に製品識別QRをスキャンしてください',
    });
  }

  const expected = nextExpectedType(session.status);
  if (scanType !== expected) {
    return logAndRespond(res, {
      employeeCode,
      productCode,
      scanType,
      rawQr: qrRaw,
      expectedScanType: expected,
      isError: true,
      errorMessage: `順序が違います。次にスキャンすべきは「${expected}」です`,
    });
  }

  const newStatus = statusAfter(scanType);
  updateSessionStatus.run({ productCode, employeeCode, status: newStatus });

  return logAndRespond(res, {
    employeeCode,
    productCode,
    scanType,
    rawQr: qrRaw,
    expectedScanType: expected,
    isError: false,
    extra: { status: newStatus },
  });
});

module.exports = router;
