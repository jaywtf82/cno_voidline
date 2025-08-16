// ITU-R BS.1770-4 LUFS processor with K-weighting
export class LufsProcessor extends AudioWorkletProcessor {
  private sampleRate: number = 48000;
  private buffer: Float32Array[] = [];
  private bufferSize: number = 0;
  
  // K-weighting filter coefficients (pre-computed)
  private preFilterB = new Float32Array([1.53512485958697, -2.69169618940638, 1.19839281085285]);
  private preFilterA = new Float32Array([1, -1.69065929318241, 0.73248077421585]);
  private rlbFilterB = new Float32Array([1.0, -2.0, 1.0]);
  private rlbFilterA = new Float32Array([1.0, -1.99004745483398, 0.99007225036621]);
  
  // Filter states (per channel)
  private preState: Float32Array[][] = [];
  private rlbState: Float32Array[][] = [];
  
  // Gating parameters
  private integrationTime = 3.0; // 3 seconds for short-term
  private relativeThreshold = -20.0; // LUFS
  private absoluteThreshold = -70.0; // LUFS
  
  constructor(options?: AudioWorkletNodeOptions) {
    super();
    this.sampleRate = options?.processorOptions?.sampleRate || 48000;
    this.bufferSize = Math.floor(this.sampleRate * this.integrationTime);
    
    // Initialize filter states for 2 channels
    for (let ch = 0; ch < 2; ch++) {
      this.buffer[ch] = new Float32Array(this.bufferSize);
      this.preState[ch] = [new Float32Array(2), new Float32Array(2)]; // x[n-1], x[n-2], y[n-1], y[n-2]
      this.rlbState[ch] = [new Float32Array(2), new Float32Array(2)];
    }
  }
  
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length === 0) return true;
    
    const blockSize = input[0].length;
    const numChannels = Math.min(input.length, 2);
    
    // Copy input to output (passthrough)
    for (let channel = 0; channel < numChannels; channel++) {
      if (output[channel]) {
        output[channel].set(input[channel]);
      }
    }
    
    // Process K-weighted loudness
    const blockLoudness = this.processBlock(input, blockSize);
    
    // Send loudness measurement
    this.port.postMessage({
      type: 'lufs',
      integrated: blockLoudness.integrated,
      shortTerm: blockLoudness.shortTerm,
      momentary: blockLoudness.momentary,
      range: blockLoudness.range
    });
    
    return true;
  }
  
  private processBlock(input: Float32Array[], blockSize: number) {
    let sumSquared = 0;
    
    for (let sample = 0; sample < blockSize; sample++) {
      let channelSum = 0;
      
      for (let ch = 0; ch < input.length && ch < 2; ch++) {
        const inputSample = input[ch][sample] || 0;
        
        // Apply K-weighting filters
        const preFiltered = this.applyBiquad(
          inputSample,
          this.preFilterB,
          this.preFilterA,
          this.preState[ch][0],
          this.preState[ch][1]
        );
        
        const kWeighted = this.applyBiquad(
          preFiltered,
          this.rlbFilterB,
          this.rlbFilterA,
          this.rlbState[ch][0],
          this.rlbState[ch][1]
        );
        
        // Channel weighting (L/R = 1.0, others would be different)
        channelSum += kWeighted * kWeighted;
        
        // Store in circular buffer for integration
        const bufferIndex = (this.bufferSize + sample) % this.bufferSize;
        this.buffer[ch][bufferIndex] = kWeighted * kWeighted;
      }
      
      sumSquared += channelSum;
    }
    
    // Calculate loudness in LUFS
    const meanSquare = sumSquared / (blockSize * input.length);
    const loudness = meanSquare > 0 ? -0.691 + 10 * Math.log10(meanSquare) : -70;
    
    // For this implementation, return the same value for all measurements
    // In production, these would be calculated from appropriate integration windows
    return {
      integrated: Math.max(loudness, -70),
      shortTerm: Math.max(loudness, -70),
      momentary: Math.max(loudness, -70),
      range: 0 // LRA calculation would require more complex gating
    };
  }
  
  private applyBiquad(
    input: number,
    b: Float32Array,
    a: Float32Array,
    xState: Float32Array,
    yState: Float32Array
  ): number {
    // Direct Form II implementation
    const w = input - a[1] * yState[0] - a[2] * yState[1];
    const output = b[0] * w + b[1] * yState[0] + b[2] * yState[1];
    
    // Update states
    yState[1] = yState[0];
    yState[0] = w;
    
    return output;
  }
}

registerProcessor('lufs-processor', LufsProcessor);