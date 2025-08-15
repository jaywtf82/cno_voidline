class MicroDynamicsProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._last = 0;
  }
  process(inputs) {
    const input = inputs[0];
    const channel = input && input[0] ? input[0] : [];
    let sum = 0;
    for (let i = 0; i < channel.length; i++) sum += channel[i] * channel[i];
    const rms = channel.length ? Math.sqrt(sum / channel.length) : 0;
    if (currentTime - this._last > 0.1) {
      this.port.postMessage({
        rmsFast_dB: rms ? 20 * Math.log10(rms) : -Infinity,
        rmsSlow_dB: rms ? 20 * Math.log10(rms) : -Infinity,
        deltaRMS_dB: 0,
        crest_dB: 0,
        transientsPerSec: 0,
      });
      this._last = currentTime;
    }
    return true;
  }
}
registerProcessor('microdynamics-processor', MicroDynamicsProcessor);
