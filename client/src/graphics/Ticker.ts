type TickerCallback = (deltaTime: number) => void;

class TickerManager {
  private callbacks = new Set<TickerCallback>();
  private rafId: number | null = null;
  private lastTime = 0;
  private targetFps = 60;
  private frameInterval = 1000 / 60;

  constructor() {
    // Respect user's motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.targetFps = 30;
      this.frameInterval = 1000 / 30;
    }
  }

  subscribe(callback: TickerCallback): () => void {
    this.callbacks.add(callback);
    
    if (this.callbacks.size === 1) {
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
    const tick = (currentTime: number) => {
      const deltaTime = currentTime - this.lastTime;
      
      // Adaptive resolution - if frame time exceeds target, skip this frame
      if (deltaTime >= this.frameInterval) {
        this.callbacks.forEach(callback => {
          try {
            callback(deltaTime);
          } catch (error) {
            console.error('Ticker callback error:', error);
          }
        });
        this.lastTime = currentTime;
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame((time) => {
      this.lastTime = time;
      tick(time);
    });
  }

  private stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getSubscriberCount(): number {
    return this.callbacks.size;
  }
}

export const Ticker = new TickerManager();