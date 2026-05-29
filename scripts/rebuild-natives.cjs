#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const binName = process.platform === 'win32' ? 'electron-rebuild.cmd' : 'electron-rebuild';
const electronRebuild = path.join(root, 'node_modules', '.bin', binName);
const nativeModules = ['serialport', 'node-window-manager'];

function isInstalled(name) {
  try {
    require.resolve(`${name}/package.json`, { paths: [root] });
    return true;
  } catch {
    return false;
  }
}

if (!fs.existsSync(electronRebuild)) {
  console.error('electron-rebuild is not installed. Run npm install first.');
  process.exit(1);
}

let rebuilt = 0;

for (const name of nativeModules) {
  if (!isInstalled(name)) {
    console.log(`[rebuild] Skipping optional native module not installed: ${name}`);
    continue;
  }

  console.log(`[rebuild] Rebuilding ${name} for Electron`);
  execFileSync(electronRebuild, ['-f', '-w', name], {
    cwd: root,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
  rebuilt += 1;
}

if (rebuilt === 0) {
  console.log('[rebuild] No optional native modules are installed; continuing.');
}
