const { EventEmitter } = require('events');

function normalizeConsoleMessage(details) {
  const levelMap = { 1: 'debug', 2: 'info', 3: 'error', 4: 'error' };
  return {
    level: levelMap[details.level] || 'info',
    message: details.message,
    source: details.source || 'console-api',
    sourceUrl: details.sourceUrl,
    lineNumber: details.lineNumber,
  };
}

function attachWebContentsLogging(webContents, logger) {
  if (!webContents || !logger) return;

  webContents.on('console-message', (event, arg1, arg2) => {
    let details = arg1;
    if (typeof arg1 === 'number' && typeof arg2 === 'string') {
      details = { level: arg1, message: arg2 };
    }
    const normalized = normalizeConsoleMessage(details || {});
    logger.error(`[chrome-console] ${normalized.message || 'unknown'}`, normalized);
  });

  webContents.on('render-process-gone', (event, details) => {
    logger.error('Renderer process gone', { reason: details.reason, exitCode: details.exitCode });
  });

  webContents.on('preload-error', (event, preloadPath, error) => {
    logger.error('Preload error', { path: preloadPath, error: { message: error ? error.message : '' } });
  });
}

module.exports = {
  normalizeConsoleMessage,
  attachWebContentsLogging,
};
