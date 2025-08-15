import { useEffect, useRef } from 'react';
import { attachHiDPICanvas } from '@/lib/vis/canvasKit';

interface PanelProps {
  className?: string;
}

export function StereoImagePanel({ className }: PanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return attachHiDPICanvas(canvas, (ctx) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ccc';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 30, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  return (
    <article className={className}>
      <div className="card__hd">Stereo Image</div>
      <div className="card__bd visual">
        <canvas ref={canvasRef} />
      </div>
    </article>
  );
}
