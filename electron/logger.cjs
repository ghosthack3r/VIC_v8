const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let logPath = null;

function getLogPath() {
  if (!logPath && app) {
    const userData = app.getPath('userData');
    const logsDir = path.join(userData, 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const date = new Date().toISOString().slice(0, 10);
    logPath = path.join(logsDir, `vic-${date}.jsonl`);
  }
  return logPath;
}

function log(level, message, data = {}) {
  const entry = {
    t: new Date().toISOString(),
    level,
    message,
    ...data
  };
  const p = getLogPath();
  if (p) {
    fs.appendFileSync(p, JSON.stringify(entry) + '\n');
  }
  console.log(`[${level}] ${message}`, data);
}

module.exports = {
  log,
  getLogPath,
  debug: (m, d) => log('debug', m, d),
  info: (m, d) => log('info', m, d),
  warn: (m, d) => log('warn', m, d),
  error: (m, d) => log('error', m, d),
};
