const NEXT_EXPECTED_BY_STATUS = {
  PRODUCT_SCANNED: 'S1_START',
  S1_STARTED: 'S1_END',
  S1_DONE: 'S2_START',
  S2_STARTED: 'S2_END',
  S2_DONE: 'ALL_END',
  // ALL_DONE には次の工程QRは存在しない（新サイクルはPRODUCT再スキャンから）
};

const STATUS_AFTER_SCAN = {
  S1_START: 'S1_STARTED',
  S1_END: 'S1_DONE',
  S2_START: 'S2_STARTED',
  S2_END: 'S2_DONE',
  ALL_END: 'ALL_DONE',
};

/**
 * 現在のwork_sessionsステータスから、次に期待される工程scan_typeを返す。
 * ALL_DONE、または未知のステータスの場合はnullを返す。
 */
function nextExpectedType(status) {
  return NEXT_EXPECTED_BY_STATUS[status] ?? null;
}

/**
 * 工程QRのscan_typeから、記録後のwork_sessionsステータスを返す。
 */
function statusAfter(scanType) {
  return STATUS_AFTER_SCAN[scanType] ?? null;
}

module.exports = { nextExpectedType, statusAfter };
