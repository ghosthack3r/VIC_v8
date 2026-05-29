const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { registerHandlers } = require('./ipc/index.cjs');
const logger = require('./logger.cjs');

let mainWindow = null;
let pythonProcess = null;

// ── Python backend ────────────────────────────────────────────────
function startPythonBackend() {
  const backendDir = path.join(__dirname, '../backend');
  const scriptPath = path.join(backendDir, 'server.py');
  logger.info(`Starting Python backend: ${scriptPath}`);

  // Try 'python', fall back to 'python3'
  const pythonBin = process.platform === 'win32' ? 'python' : 'python3';
  pythonProcess = spawn(pythonBin, [scriptPath], {
    cwd: backendDir,
    env: { ...process.env },
  });

  pythonProcess.stdout.on('data', (data) => {
    logger.info(`[ADA Backend] ${data.toString().trim()}`);
  });
  pythonProcess.stderr.on('data', (data) => {
    // stderr is often used for info in Python — log it but don't treat as fatal
    logger.info(`[ADA Backend ERR] ${data.toString().trim()}`);
  });
  pythonProcess.on('close', (code) => {
    logger.info(`[ADA Backend] exited with code ${code}`);
    pythonProcess = null;
  });
  pythonProcess.on('error', (err) => {
    logger.info(`[ADA Backend] failed to start: ${err.message}`);
    // Non-fatal: frontend can still run without backend (shows connection error)
  });
}

function stopPythonBackend() {
  if (pythonProcess) {
    logger.info('[ADA Backend] Stopping...');
    pythonProcess.kill('SIGTERM');
    pythonProcess = null;
  }
}

// ── Window ────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#000000',
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    fullscreen: process.env.VIC_FULLSCREEN !== '0',
  });

  const isDev = process.env.ELECTRON_IS_DEV === '1'
    || (process.env.ELECTRON_IS_DEV !== '0' && !app.isPackaged);

  const tryLoad = (retries = 3) => {
    const p = isDev
      ? mainWindow.loadURL('http://127.0.0.1:5173')
      : mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

    p.then(() => {
      mainWindow.show();
      if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
    }).catch((err) => {
      logger.info(`Load failed: ${err.message}. Retries left: ${retries}`);
      if (retries > 0) setTimeout(() => tryLoad(retries - 1), 1000);
      else mainWindow.show();
    });
  };

  tryLoad();
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── App lifecycle ─────────────────────────────────────────────────
app.whenReady().then(() => {
  logger.info('VIC starting up');
  startPythonBackend();
  createWindow();
  registerHandlers({
    ipcMain,
    broadcast: (ch, p) => mainWindow && mainWindow.webContents.send(ch, p),
    getMainWindow: () => mainWindow,
    permissions: { check: async () => ({ allowed: true }) },
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopPythonBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopPythonBackend();
});

module.exports = { createWindow };
