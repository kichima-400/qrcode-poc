const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS scan_logs (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code       TEXT NOT NULL,
    product_code        TEXT,
    scan_type           TEXT NOT NULL CHECK (scan_type IN (
                           'EMPLOYEE','PRODUCT',
                           'S1_START','S1_END','S2_START','S2_END','ALL_END',
                           'UNKNOWN'
                         )),
    raw_qr              TEXT NOT NULL,
    expected_scan_type  TEXT,
    is_error            INTEGER NOT NULL DEFAULT 0,
    error_message       TEXT,
    scanned_at          TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_scan_logs_employee ON scan_logs(employee_code, scanned_at);
  CREATE INDEX IF NOT EXISTS idx_scan_logs_product  ON scan_logs(product_code, scanned_at);

  CREATE TABLE IF NOT EXISTS work_sessions (
    product_code     TEXT PRIMARY KEY,
    current_employee TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'PRODUCT_SCANNED' CHECK (status IN (
                        'PRODUCT_SCANNED',
                        'S1_STARTED','S1_DONE',
                        'S2_STARTED','S2_DONE',
                        'ALL_DONE'
                      )),
    started_at       TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`);

module.exports = db;
