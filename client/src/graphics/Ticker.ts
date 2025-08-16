// Single global RAF loop for all animations
export type TickerCallback = (deltaTime: number, isLagging?: boolean) => void;

class TickerManager {
  private callbacks = new Set<TickerCallback>();
  private animationId: number | null = null;
  private lastTime = 0;
  private isRunning = false;

  private tick = (currentTime: number) => {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Respect prefers-reduced-motion by capping at 30fps
    const maxFps = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 30 : 60;
    const minInterval = 1000 / maxFps;
    
    // Adaptive resolution: reduce quality when frame time > 24ms
    const isLagging = deltaTime > 24;
    
    if (deltaTime >= minInterval) {
      this.callbacks.forEach(callback => {
        try {
          callback(deltaTime, isLagging);
        } catch (error) {
          console.error('Ticker callback error:', error);
        }
      });
    }
    
    this.animationId = requestAnimationFrame(this.tick);
  };

  subscribe(callback: TickerCallback): () => void {
    this.callbacks.add(callback);
    
    if (this.callbacks.size === 1 && !this.isRunning) {
      this.start();
    }
    
    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        this.stop();
      }
    };
  }

  private start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.tick);
  }

  private stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

export const Ticker = new TickerManager();