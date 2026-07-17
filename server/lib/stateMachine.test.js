const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nextExpectedType, statusAfter } = require('./stateMachine');

test('PRODUCT_SCANNEDの次はS1_START', () => {
  assert.equal(nextExpectedType('PRODUCT_SCANNED'), 'S1_START');
});

test('S1_STARTEDの次はS1_END', () => {
  assert.equal(nextExpectedType('S1_STARTED'), 'S1_END');
});

test('S1_DONEの次はS2_START', () => {
  assert.equal(nextExpectedType('S1_DONE'), 'S2_START');
});

test('S2_STARTEDの次はS2_END', () => {
  assert.equal(nextExpectedType('S2_STARTED'), 'S2_END');
});

test('S2_DONEの次はALL_END', () => {
  assert.equal(nextExpectedType('S2_DONE'), 'ALL_END');
});

test('ALL_DONEの次はない(null)', () => {
  assert.equal(nextExpectedType('ALL_DONE'), null);
});

test('未知のステータスはnull', () => {
  assert.equal(nextExpectedType('UNKNOWN_STATUS'), null);
});

test('工程QRスキャン後のステータス遷移', () => {
  assert.equal(statusAfter('S1_START'), 'S1_STARTED');
  assert.equal(statusAfter('S1_END'), 'S1_DONE');
  assert.equal(statusAfter('S2_START'), 'S2_STARTED');
  assert.equal(statusAfter('S2_END'), 'S2_DONE');
  assert.equal(statusAfter('ALL_END'), 'ALL_DONE');
});

test('工程QR以外のscan_typeはnull', () => {
  assert.equal(statusAfter('PRODUCT'), null);
  assert.equal(statusAfter('EMPLOYEE'), null);
});
