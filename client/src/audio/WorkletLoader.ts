/**
 * WorkletLoader.ts - Utility for loading AudioWorklet modules
 */

export class WorkletLoader {
  private loadedWorklets = new Set<string>();

  async loadAllWorklets(context: AudioContext): Promise<void> {
    const worklets = [
      'meter-processor',
      'lufs-processor', 
      'fft-processor',
      'ms-eq-processor',
      'limiter-processor',
      'denoise-processor',
      'f0-tracker-processor'
    ];

    await Promise.all(worklets.map(name => this.loadWorklet(context, name)));
  }

  async loadWorklet(context: AudioContext, name: string): Promise<void> {
    const key = `${context.sampleRate}-${name}`;
    if (this.loadedWorklets.has(key)) return;

    try {
      await context.audioWorklet.addModule(`./worklets/${name}.js`);
      this.loadedWorklets.add(key);
    } catch (error) {
      console.warn(`Failed to load worklet ${name}:`, error);
      // Continue without the worklet
    }
  }
}