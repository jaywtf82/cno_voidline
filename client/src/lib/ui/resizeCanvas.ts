// Resize any <canvas> to its CSS box using ResizeObserver, with HiDPI support.
export function attachHiDPICanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const ro = new ResizeObserver(() => {
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width  * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      // reset transform so drawings use CSS pixel units
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  });
  ro.observe(canvas);
  return () => ro.disconnect();
}
