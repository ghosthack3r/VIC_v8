const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function parseCommonJs(relativePath) {
  const filename = path.join(root, relativePath);
  const source = fs.readFileSync(filename, 'utf8').replace(/^#!.*\r?\n/, '');
  new Function('require', 'module', 'exports', '__filename', '__dirname', source);
}

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('precheck script uses a CommonJS entrypoint in the ESM package', () => {
  const pkg = readJson('package.json');

  assert.strictEqual(pkg.type, 'module');
  assert.match(pkg.scripts.precheck, /scripts\/precheck\.cjs$/);
  assert.ok(fs.existsSync(path.join(root, 'scripts/precheck.cjs')));
});

test('Electron CommonJS files parse before launch', () => {
  const files = [
    'scripts/precheck.cjs',
    'scripts/rebuild-natives.cjs',
    'electron/logger.cjs',
    'electron/logging-hooks.cjs',
    'electron/main.cjs',
    'electron/ipc/logs.cjs',
    'electron/ipc/windows.cjs',
    'electron/ipc/obd.cjs',
    'electron/ipc/gemini.cjs',
    'electron/ipc/gemini-simulation.cjs',
  ];

  for (const file of files) {
    parseCommonJs(file);
  }
});
