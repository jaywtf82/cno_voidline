class CorrelationProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._last = 0;
  }
  process(inputs) {
    const left = inputs[0] && inputs[0][0] ? inputs[0][0] : [];
    const right = inputs[0] && inputs[0][1] ? inputs[0][1] : [];
    let corr = 0;
    const len = Math.min(left.length, right.length);
    for (let i = 0; i < len; i++) corr += left[i] * right[i];
    corr = len ? corr / len : 0;
    if (currentTime - this._last > 0.1) {
      this.port.postMessage({
        corr,
        mid_dB: 0,
        side_dB: 0,
        scope: new Float32Array(),
      });
      this._last = currentTime;
    }
    return true;
  }
}
registerProcessor('correlation-processor', CorrelationProcessor);
