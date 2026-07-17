const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseQr } = require('./qrParser');

test('社員QRをパースできる', () => {
  const result = parseQr('EMP-001');
  assert.equal(result.scanType, 'EMPLOYEE');
  assert.equal(result.employeeCode, 'EMP-001');
  assert.equal(result.productCode, null);
});

test('製品識別番号QRをパースできる', () => {
  const result = parseQr('PROD-01');
  assert.equal(result.scanType, 'PRODUCT');
  assert.equal(result.productCode, '01');
});

test('工程QR(工程1開始)をパースできる', () => {
  const result = parseQr('PROC-01-S1_START');
  assert.equal(result.scanType, 'S1_START');
  assert.equal(result.productCode, '01');
});

test('工程QR(全工程完了)をパースできる', () => {
  const result = parseQr('PROC-05-ALL_END');
  assert.equal(result.scanType, 'ALL_END');
  assert.equal(result.productCode, '05');
});

test('未知のフォーマットはUNKNOWNになる', () => {
  const result = parseQr('HOGE-FUGA');
  assert.equal(result.scanType, 'UNKNOWN');
});

test('空文字・非文字列はUNKNOWNになる', () => {
  assert.equal(parseQr('').scanType, 'UNKNOWN');
  assert.equal(parseQr(null).scanType, 'UNKNOWN');
  assert.equal(parseQr(undefined).scanType, 'UNKNOWN');
});

test('工程種別が不正な工程QRはUNKNOWNになる', () => {
  const result = parseQr('PROC-01-S3_START');
  assert.equal(result.scanType, 'UNKNOWN');
});
