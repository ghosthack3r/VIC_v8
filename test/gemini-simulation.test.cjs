const assert = require('assert');
const { createSimulationResponder } = require('../electron/ipc/gemini-simulation.cjs');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function createTimers() {
  let nextId = 1;
  const pending = new Map();
  return {
    setTimeout(fn) {
      const id = nextId++;
      pending.set(id, fn);
      return id;
    },
    clearTimeout(id) {
      pending.delete(id);
    },
    flush() {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((fn) => fn());
    },
    count() {
      return pending.size;
    },
  };
}

test('simulation responder emits one transcript for a burst of audio chunks', () => {
  const timers = createTimers();
  const events = [];
  const responder = createSimulationResponder({
    delayMs: 50,
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    pickTranscript: () => 'show me the system status',
  });

  responder.receiveAudio('aaa', (channel, payload) => events.push({ channel, payload }));
  responder.receiveAudio('bbb', (channel, payload) => events.push({ channel, payload }));
  responder.receiveAudio('ccc', (channel, payload) => events.push({ channel, payload }));

  assert.strictEqual(timers.count(), 1);
  timers.flush();

  assert.deepStrictEqual(events, [
    { channel: 'gemini:transcription', payload: 'show me the system status' },
    { channel: 'gemini:turnComplete', payload: {} },
  ]);
});
