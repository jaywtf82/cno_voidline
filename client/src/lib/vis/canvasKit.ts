export function attachHiDPICanvas(
  canvas: HTMLCanvasElement,
  onResize?: (ctx: CanvasRenderingContext2D) => void
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    onResize?.(ctx);
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  return () => ro.disconnect();
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export class RingBuffer<T> {
  private buf: T[];
  private idx = 0;

  constructor(private size: number, fill: T) {
    this.buf = Array(size).fill(fill);
  }

  push(v: T) {
    this.buf[this.idx] = v;
    this.idx = (this.idx + 1) % this.size;
  }

  values() {
    return [...this.buf.slice(this.idx), ...this.buf.slice(0, this.idx)];
  }
}
