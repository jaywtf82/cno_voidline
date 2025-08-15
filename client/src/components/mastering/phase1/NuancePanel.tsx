import { useEffect, useRef } from 'react';
import { attachHiDPICanvas } from '@/lib/vis/canvasKit';

interface PanelProps {
  className?: string;
}

export function NuancePanel({ className }: PanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return attachHiDPICanvas(canvas, (ctx) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(10, 10, 20, 20);
    });
  }, []);

  return (
    <article className={className}>
      <div className="card__hd">Nuance</div>
      <div className="card__bd visual small">
        <canvas ref={canvasRef} />
      </div>
    </article>
  );
}
