const { spawn } = require('child_process');
const path = require('path');

const mode = process.argv[2] || 'development';
const isProd = mode === 'production';

console.log(`[launch] Starting in ${mode} mode`);

const electronPath = require('electron');

const mainScript = path.join(__dirname, 'main.cjs');
const args = [mainScript];

const child = spawn(electronPath, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: isProd ? 'production' : 'development',
    ELECTRON_IS_DEV: isProd ? '0' : '1'
  }
});

child.on('close', (code) => {
  console.log(`[launch] Electron process exited with code ${code}`);
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('[launch] Failed to start Electron:', err);
  process.exit(1);
});