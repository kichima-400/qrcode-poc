const PROCESS_TYPES = ['S1_START', 'S1_END', 'S2_START', 'S2_END', 'ALL_END'];

/**
 * QR文字列をパースする。
 * EMP-{社員番号} / PROD-{製品番号} / PROC-{製品番号}-{工程種別}
 * @param {string} raw
 * @returns {{ scanType: string, productCode: string|null, employeeCode: string|null }}
 */
function parseQr(raw) {
  if (typeof raw !== 'string') {
    return { scanType: 'UNKNOWN', productCode: null, employeeCode: null };
  }

  const empMatch = raw.match(/^EMP-(.+)$/);
  if (empMatch) {
    return { scanType: 'EMPLOYEE', productCode: null, employeeCode: raw };
  }

  const prodMatch = raw.match(/^PROD-(.+)$/);
  if (prodMatch) {
    return { scanType: 'PRODUCT', productCode: prodMatch[1], employeeCode: null };
  }

  const procMatch = raw.match(/^PROC-(.+)-(S1_START|S1_END|S2_START|S2_END|ALL_END)$/);
  if (procMatch) {
    return { scanType: procMatch[2], productCode: procMatch[1], employeeCode: null };
  }

  return { scanType: 'UNKNOWN', productCode: null, employeeCode: null };
}

module.exports = { parseQr, PROCESS_TYPES };
