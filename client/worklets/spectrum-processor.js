class SpectrumProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._last = 0;
  }
  process(inputs) {
    const input = inputs[0] && inputs[0][0] ? inputs[0][0] : [];
    const bins = new Float32Array(32);
    if (currentTime - this._last > 0.1) {
      this.port.postMessage({
        bars_dB: bins,
        smooth_dB: bins,
        freqs_Hz: bins,
      });
      this._last = currentTime;
    }
    return true;
  }
}
registerProcessor('spectrum-processor', SpectrumProcessor);
