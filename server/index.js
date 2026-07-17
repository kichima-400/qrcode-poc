const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const express = require('express');

const scanRouter = require('./routes/scan');
const historyRouter = require('./routes/history');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/scan', scanRouter);
app.use('/api', historyRouter);

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, 'server.key');
const certPath = path.join(certDir, 'server.crt');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  https.createServer(options, app).listen(HTTPS_PORT, () => {
    console.log(`HTTPSサーバ起動: https://localhost:${HTTPS_PORT}`);
  });
} else {
  console.log('証明書が見つからないためHTTPで起動します（server/certs/server.key, server.crt を配置するとHTTPSになります）');
  http.createServer(app).listen(PORT, () => {
    console.log(`HTTPサーバ起動: http://localhost:${PORT}`);
  });
}
