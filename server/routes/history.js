const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/history', (req, res) => {
  const { employeeCode, productCode, isError, limit, offset } = req.query;

  const conditions = [];
  const params = {};

  if (employeeCode) {
    conditions.push('employee_code = @employeeCode');
    params.employeeCode = employeeCode;
  }
  if (productCode) {
    conditions.push('product_code = @productCode');
    params.productCode = productCode;
  }
  if (isError === 'true' || isError === 'false') {
    conditions.push('is_error = @isError');
    params.isError = isError === 'true' ? 1 : 0;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.limit = Number.isFinite(Number(limit)) && limit ? Number(limit) : 100;
  params.offset = Number.isFinite(Number(offset)) && offset ? Number(offset) : 0;

  const rows = db
    .prepare(`SELECT * FROM scan_logs ${where} ORDER BY scanned_at DESC, id DESC LIMIT @limit OFFSET @offset`)
    .all(params);

  res.json({ rows });
});

router.get('/sessions', (req, res) => {
  const rows = db.prepare('SELECT * FROM work_sessions ORDER BY updated_at DESC').all();
  res.json({ rows });
});

module.exports = router;
