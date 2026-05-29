const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function loadTsModule(relativePath) {
  const filename = path.join(root, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', '__filename', '__dirname', output)(
    require,
    mod,
    mod.exports,
    filename,
    path.dirname(filename),
  );
  return mod.exports;
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

const auraState = loadTsModule('src/components/vicOrbState.ts');

test('maps backend core states to aura visualizer modes', () => {
  assert.strictEqual(auraState.getAuraMode({ loading: true, coreState: 'idle' }), 'loading');
  assert.strictEqual(auraState.getAuraMode({ coreState: 'idle' }), 'standby');
  assert.strictEqual(auraState.getAuraMode({ coreState: 'listening' }), 'listening');
  assert.strictEqual(auraState.getAuraMode({ holding: true, coreState: 'idle' }), 'listening');
  assert.strictEqual(auraState.getAuraMode({ coreState: 'thinking' }), 'thinking');
  assert.strictEqual(auraState.getAuraMode({ coreState: 'speaking' }), 'talking');
});

test('keeps boot aura in standby before loading phase transition', () => {
  assert.strictEqual(auraState.getBootAuraMode(0), 'standby');
  assert.strictEqual(auraState.getBootAuraMode(1), 'standby');
  assert.strictEqual(auraState.getBootAuraMode(2), 'loading');
  assert.strictEqual(auraState.getBootAuraMode(4), 'loading');
});

test('derives a bounded thinking intensity from system load and memory', () => {
  assert.strictEqual(auraState.getThinkingIntensity(null), 0.35);
  assert.strictEqual(
    auraState.getThinkingIntensity({
      load: { total: 80 },
      memory: { usedPct: 40 },
    }),
    0.64,
  );
  assert.strictEqual(
    auraState.getThinkingIntensity({
      load: { total: 500 },
      memory: { usedPct: 500 },
    }),
    1,
  );
});
