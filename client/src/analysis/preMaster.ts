import { PreMasterMeta, PreMasterAnalysis } from '@/state/sessionBus';

// Pre-allocate typed arrays for analysis
const analysisBuffers = {
  channelData: new Float32Array(8192),
  fftBuffer: new Float32Array(8192),
  spectrum: new Float32Array(2048),
  windowedBuffer: new Float32Array(4096),
  magnitudes: new Float32Array(2048),
};

// Hann window coefficients (pre-computed)
const hannWindow = new Float32Array(4096);
for (let i = 0; i < 4096; i++) {
  hannWindow[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (4096 - 1)));
}

// Simple FFT implementation for spectrum analysis
function computeFFT(buffer: Float32Array, size: number): Float32Array {
  const real = new Float32Array(size);
  const imag = new Float32Array(size);
  const magnitudes = new Float32Array(size / 2);
  
  // Copy input to real part
  for (let i = 0; i < size; i++) {
    real[i] = buffer[i];
    imag[i] = 0;
  }
  
  // Simple DFT (not optimized, but functional)
  for (let k = 0; k < size / 2; k++) {
    let realSum = 0;
    let imagSum = 0;
    
    for (let n = 0; n < size; n++) {
      const angle = -2 * Math.PI * k * n / size;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      realSum += real[n] * cos - imag[n] * sin;
      imagSum += real[n] * sin + imag[n] * cos;
    }
    
    magnitudes[k] = Math.sqrt(realSum * realSum + imagSum * imagSum) / size;
  }
  
  return magnitudes;
}

// K-weighting filter approximation
function applyKWeighting(sample: number, prevSample: number, state: { z1: number; z2: number }): number {
  // Simple high-pass approximation of K-weighting
  const b0 = 1.53512485958697;
  const b1 = -2.69169618940638;
  const b2 = 1.19839281085285;
  const a1 = -1.69065929318241;
  const a2 = 0.73248077421585;
  
  const output = b0 * sample + b1 * prevSample + b2 * state.z2 - a1 * state.z1 - a2 * state.z2;
  
  state.z2 = state.z1;
  state.z1 = output;
  
  return output;
}

export async function analyzePreMaster(file: File): Promise<{
  meta: PreMasterMeta;
  analysis: PreMasterAnalysis;
}> {
  // Create object URL for the file
  const objectUrl = URL.createObjectURL(file);
  
  // Generate simple hash from file metadata
  const hashInput = `${file.name}${file.size}${file.lastModified}${file.type}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(hashInput);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  
  const meta: PreMasterMeta = {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    objectUrl,
    hash,
  };
  
  // Decode audio for analysis
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const sampleRate = audioBuffer.sampleRate;
  const durationSec = audioBuffer.duration;
  const numChannels = audioBuffer.numberOfChannels;
  
  // Get channel data
  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = numChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;
  
  // Compute peak and RMS
  let peak = 0;
  let sumSquares = 0;
  let correlation = 0;
  let crossProduct = 0;
  let leftSquares = 0;
  let rightSquares = 0;
  
  const numSamples = leftChannel.length;
  
  for (let i = 0; i < numSamples; i++) {
    const left = leftChannel[i];
    const right = rightChannel[i];
    
    peak = Math.max(peak, Math.abs(left), Math.abs(right));
    sumSquares += left * left + right * right;
    
    if (numChannels > 1) {
      crossProduct += left * right;
      leftSquares += left * left;
      rightSquares += right * right;
    }
  }
  
  const rms = Math.sqrt(sumSquares / (numSamples * numChannels));
  const peakDb = 20 * Math.log10(peak || 1e-10);
  const rmsDb = 20 * Math.log10(rms || 1e-10);
  
  // Compute stereo correlation (Pearson coefficient)
  if (numChannels > 1 && leftSquares > 0 && rightSquares > 0) {
    correlation = crossProduct / Math.sqrt(leftSquares * rightSquares);
  } else {
    correlation = 1; // Mono or silent
  }
  
  // Approximate LUFS calculation with K-weighting
  let lufsSum = 0;
  const kState = { z1: 0, z2: 0 };
  let prevSample = 0;
  
  const blockSize = Math.floor(sampleRate * 0.4); // 400ms blocks
  const numBlocks = Math.floor(numSamples / blockSize);
  let validBlocks = 0;
  
  for (let block = 0; block < numBlocks; block++) {
    const startIdx = block * blockSize;
    let blockSum = 0;
    
    for (let i = startIdx; i < startIdx + blockSize && i < numSamples; i++) {
      const mono = (leftChannel[i] + rightChannel[i]) / 2;
      const weighted = applyKWeighting(mono, prevSample, kState);
      blockSum += weighted * weighted;
      prevSample = mono;
    }
    
    const blockLoudness = -0.691 + 10 * Math.log10(blockSum / blockSize || 1e-10);
    
    // Apply absolute gate (-70 LUFS)
    if (blockLoudness > -70) {
      lufsSum += Math.pow(10, blockLoudness / 10);
      validBlocks++;
    }
  }
  
  const lufsIntegrated = validBlocks > 0 ? -0.691 + 10 * Math.log10(lufsSum / validBlocks) : -70;
  
  // Estimate short-term LUFS (3 second window)
  const shortTermWindow = Math.floor(sampleRate * 3);
  const midpoint = Math.floor(numSamples / 2);
  const startIdx = Math.max(0, midpoint - shortTermWindow / 2);
  const endIdx = Math.min(numSamples, startIdx + shortTermWindow);
  
  let shortTermSum = 0;
  const shortKState = { z1: 0, z2: 0 };
  let shortPrevSample = 0;
  
  for (let i = startIdx; i < endIdx; i++) {
    const mono = (leftChannel[i] + rightChannel[i]) / 2;
    const weighted = applyKWeighting(mono, shortPrevSample, shortKState);
    shortTermSum += weighted * weighted;
    shortPrevSample = mono;
  }
  
  const lufsShort = -0.691 + 10 * Math.log10(shortTermSum / (endIdx - startIdx) || 1e-10);
  
  // Compute noise floor (10th percentile of RMS)
  const blockRMSValues: number[] = [];
  const noiseBlockSize = Math.floor(sampleRate * 0.1); // 100ms blocks
  
  for (let i = 0; i < numSamples; i += noiseBlockSize) {
    let blockSum = 0;
    const blockEnd = Math.min(i + noiseBlockSize, numSamples);
    
    for (let j = i; j < blockEnd; j++) {
      const sample = (leftChannel[j] + rightChannel[j]) / 2;
      blockSum += sample * sample;
    }
    
    const blockRMS = Math.sqrt(blockSum / (blockEnd - i));
    blockRMSValues.push(blockRMS);
  }
  
  blockRMSValues.sort((a, b) => a - b);
  const noiseFloorRMS = blockRMSValues[Math.floor(blockRMSValues.length * 0.1)] || 1e-10;
  const noiseFloorDb = 20 * Math.log10(noiseFloorRMS);
  
  // Compute spectrum snapshot (4096 FFT -> 2048 bins)
  const fftSize = 4096;
  const startSample = Math.floor(numSamples / 2) - fftSize / 2;
  
  // Window the audio data
  for (let i = 0; i < fftSize; i++) {
    const sampleIdx = startSample + i;
    if (sampleIdx >= 0 && sampleIdx < numSamples) {
      analysisBuffers.windowedBuffer[i] = ((leftChannel[sampleIdx] + rightChannel[sampleIdx]) / 2) * hannWindow[i];
    } else {
      analysisBuffers.windowedBuffer[i] = 0;
    }
  }
  
  // Compute FFT
  const magnitudes = computeFFT(analysisBuffers.windowedBuffer, fftSize);
  
  // Convert to 2048 linear bins (0..1 normalized)
  const spectrumSnapshot = new Float32Array(2048);
  let maxMagnitude = 0;
  
  for (let i = 0; i < 2048; i++) {
    maxMagnitude = Math.max(maxMagnitude, magnitudes[i]);
  }
  
  for (let i = 0; i < 2048; i++) {
    spectrumSnapshot[i] = maxMagnitude > 0 ? magnitudes[i] / maxMagnitude : 0;
  }
  
  const analysis: PreMasterAnalysis = {
    peakDb,
    rmsDb,
    lufsShort,
    lufsIntegrated,
    noiseFloorDb,
    corr: correlation,
    spectrumSnapshot,
    sampleRate,
    durationSec,
  };
  
  audioContext.close();
  
  return { meta, analysis };
}