const historyTableBody = document.querySelector('#history-table tbody');
const sessionsTableBody = document.querySelector('#sessions-table tbody');

function appendRow(tbody, values, { isError = false } = {}) {
  const tr = document.createElement('tr');
  if (isError) tr.classList.add('error-row');
  for (const value of values) {
    const td = document.createElement('td');
    td.textContent = value ?? '';
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
}

async function loadSessions() {
  const res = await fetch('/api/sessions');
  const data = await res.json();

  sessionsTableBody.innerHTML = '';
  for (const row of data.rows) {
    appendRow(sessionsTableBody, [row.product_code, row.status, row.current_employee, row.updated_at]);
  }
}

async function loadHistory() {
  const employeeCode = document.getElementById('filter-employee').value.trim();
  const productCode = document.getElementById('filter-product').value.trim();
  const isError = document.getElementById('filter-error').value;

  const params = new URLSearchParams();
  if (employeeCode) params.set('employeeCode', employeeCode);
  if (productCode) params.set('productCode', productCode);
  if (isError) params.set('isError', isError);
  params.set('limit', '200');

  const res = await fetch(`/api/history?${params.toString()}`);
  const data = await res.json();

  historyTableBody.innerHTML = '';
  for (const row of data.rows) {
    appendRow(
      historyTableBody,
      [row.scanned_at, row.employee_code, row.product_code, row.scan_type, row.is_error ? 'エラー' : 'OK', row.error_message],
      { isError: !!row.is_error }
    );
  }
}

document.getElementById('filter-apply').addEventListener('click', loadHistory);

loadSessions();
loadHistory();
