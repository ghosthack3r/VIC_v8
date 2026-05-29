const assert = require('assert');
const { EventEmitter } = require('events');
const { attachWebContentsLogging, normalizeConsoleMessage } = require('../electron/logging-hooks.cjs');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function createCaptureLogger() {
  const entries = [];
  return {
    entries,
    debug: (message, data) => entries.push({ level: 'debug', message, data }),
    info: (message, data) => entries.push({ level: 'info', message, data }),
    warn: (message, data) => entries.push({ level: 'warn', message, data }),
    error: (message, data) => entries.push({ level: 'error', message, data }),
  };
}

test('normalizes Electron console message details with source location', () => {
  const normalized = normalizeConsoleMessage({
    level: 3,
    message: 'ReferenceError: boom',
    source: 'javascript',
    sourceUrl: 'http://127.0.0.1:5173/src/App.tsx',
    lineNumber: 42,
  });

  assert.deepStrictEqual(normalized, {
    level: 'error',
    message: 'ReferenceError: boom',
    source: 'javascript',
    sourceUrl: 'http://127.0.0.1:5173/src/App.tsx',
    lineNumber: 42,
  });
});

test('attaches webContents handlers for Chrome console and renderer lifecycle failures', () => {
  const webContents = new EventEmitter();
  const logger = createCaptureLogger();
  attachWebContentsLogging(webContents, logger);

  webContents.emit('console-message', {}, {
    level: 3,
    message: 'Uncaught TypeError: nope',
    source: 'console-api',
    sourceUrl: 'app://renderer/main.js',
    lineNumber: 7,
  });
  webContents.emit('render-process-gone', {}, { reason: 'crashed', exitCode: 9 });
  webContents.emit('preload-error', {}, 'preload.cjs', new Error('bridge failed'));

  assert.strictEqual(logger.entries.length, 3);
  assert.strictEqual(logger.entries[0].level, 'error');
  assert.strictEqual(logger.entries[0].message, '[chrome-console] Uncaught TypeError: nope');
  assert.strictEqual(logger.entries[1].message, 'Renderer process gone');
  assert.strictEqual(logger.entries[2].data.error.message, 'bridge failed');
});
