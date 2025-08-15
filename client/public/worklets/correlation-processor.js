
/**
 * correlation-processor.js - Stereo correlation analysis
 */

class CorrelationProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.correlation = 0;
    this.correlationBuffer = [];
    this.bufferSize = 1024;
    this.frameCount = 0;
    
    this.xyBuffer = { x: [], y: [] };
    this.xyBufferSize = 512;
  }

  calculateCorrelation(left, right) {
    if (left.length !== right.length) return 0;

    let sumL = 0, sumR = 0, sumLR = 0, sumL2 = 0, sumR2 = 0;
    const n = left.length;

    for (let i = 0; i < n; i++) {
      sumL += left[i];
      sumR += right[i];
      sumLR += left[i] * right[i];
      sumL2 += left[i] * left[i];
      sumR2 += right[i] * right[i];
    }

    const numerator = n * sumLR - sumL * sumR;
    const denominator = Math.sqrt((n * sumL2 - sumL * sumL) * (n * sumR2 - sumR * sumR));
    
    return denominator !== 0 ? numerator / denominator : 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length === 0) return true;

    const leftChannel = input[0];
    const rightChannel = input.length > 1 ? input[1] : input[0];

    // Calculate correlation
    this.correlation = this.calculateCorrelation(leftChannel, rightChannel);

    // Update XY buffer for vectorscope
    for (let i = 0; i < leftChannel.length; i += 4) { // Downsample for efficiency
      this.xyBuffer.x.push(leftChannel[i]);
      this.xyBuffer.y.push(rightChannel[i]);
    }

    // Maintain XY buffer size
    while (this.xyBuffer.x.length > this.xyBufferSize) {
      this.xyBuffer.x.shift();
      this.xyBuffer.y.shift();
    }

    // Send data every 10 frames
    if (this.frameCount % 10 === 0) {
      this.port.postMessage({
        type: 'correlation',
        correlation: this.correlation,
        xyBuffer: {
          x: Array.from(this.xyBuffer.x),
          y: Array.from(this.xyBuffer.y)
        },
        timestamp: currentTime
      });
    }

    this.frameCount++;

    // Pass audio through
    for (let channel = 0; channel < output.length; channel++) {
      output[channel].set(input[channel] || input[0]);
    }

    return true;
  }
}

registerProcessor('correlation-processor', CorrelationProcessor);
