#!/usr/bin/env node

/**
 * VIC Precheck Script
 * 
 * Runs: dependency check → install → rebuild native modules → build → start
 * 
 * Usage: npm run precheck
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';

function log(msg, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    white: '\x1b[37m'
  };
  console.log(colors[color] + msg + colors.reset);
}

function run(command, options = {}) {
  try {
    log(`\n▶ ${command}`, 'cyan');
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (e) {
    log(`\n✗ Command failed: ${command}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🚀 VIC Precheck — Full Setup & Launch\n', 'magenta');
  log('This will: check deps → install → rebuild natives → build → start\n', 'yellow');

  // 1. Check Node.js
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    log(`✅ Node.js: ${nodeVersion}`, 'green');
  } catch {
    log('❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org', 'red');
    process.exit(1);
  }

  // 2. Check npm
  try {
    const npmVersion = execSync('npm --version').toString().trim();
    log(`✅ npm: v${npmVersion}`, 'green');
  } catch {
    log('❌ npm not found.', 'red');
    process.exit(1);
  }

  // 3. Check if node_modules exists
  const hasNodeModules = fs.existsSync(path.join(process.cwd(), 'node_modules'));

  if (!hasNodeModules) {
    log('\n📦 node_modules not found. Installing dependencies...', 'yellow');
    if (!run('npm install')) {
      log('\n❌ npm install failed. Please check your internet connection and try again.', 'red');
      process.exit(1);
    }
  } else {
    log('\n✅ node_modules found', 'green');
  }

  // 4. Rebuild native modules (CRITICAL for Windows)
  log('\n🔧 Rebuilding native modules (serialport, node-window-manager, etc.)...', 'yellow');
  log('   This step is required on Windows and after any npm install.\n', 'yellow');

  if (!run('npm run rebuild')) {
    log('\n⚠️  Native module rebuild failed.', 'red');
    
    if (isWindows) {
      log('\nThis is almost always because Visual Studio Build Tools 2022 is missing.', 'yellow');
      log('\n📥 Please install it now:', 'cyan');
      log('   1. Download: https://aka.ms/vs/17/release/vs_buildtools.exe', 'white');
      log('   2. Select workload: "Desktop development with C++"', 'white');
      log('   3. Restart this terminal and run: npm run precheck', 'white');
      log('\nAfter installing, the rebuild will succeed.\n', 'yellow');
    } else {
      log('\nOn Linux/macOS, try: sudo apt install build-essential python3', 'yellow');
    }
    process.exit(1);
  }

  log('\n✅ Native modules rebuilt successfully!', 'green');

  // 5. Build
  log('\n🏗️  Building project...', 'yellow');
  if (!run('npm run build')) {
    log('\n❌ Build failed. Please check the TypeScript errors above.', 'red');
    process.exit(1);
  }

  log('\n✅ Build successful!', 'green');

  // 6. Start the app
  log('\n🎉 Everything ready! Starting VIC...\n', 'green');
  log('Press Ctrl+C to stop.\n', 'cyan');

  // Start dev mode
  const dev = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit',
    shell: true 
  });

  dev.on('close', (code) => {
    log(`\nVIC exited with code ${code}`, 'yellow');
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
