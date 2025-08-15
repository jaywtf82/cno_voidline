import { useEffect, useRef } from 'react';
import { attachHiDPICanvas } from '@/lib/vis/canvasKit';

interface PanelProps {
  className?: string;
}

export function DynamicsPanel({ className }: PanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return attachHiDPICanvas(canvas, (ctx) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f90';
      ctx.fillRect(10, canvas.height - 30, 20, 20);
    });
  }, []);

  return (
    <article className={className}>
      <div className="card__hd">Dynamics</div>
      <div className="card__bd visual small">
        <canvas ref={canvasRef} />
      </div>
    </article>
  );
}
