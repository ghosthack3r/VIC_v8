function createSimulationResponder(opts = {}) {
  const { delayMs = 50, setTimeout = global.setTimeout, clearTimeout = global.clearTimeout, pickTranscript = () => 'test transcript' } = opts;
  let timer = null;
  return {
    receiveAudio(chunk, emit) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        emit('gemini:transcription', pickTranscript());
        emit('gemini:turnComplete', {});
      }, delayMs);
    }
  };
}

module.exports = { createSimulationResponder };
