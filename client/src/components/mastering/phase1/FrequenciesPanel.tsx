import { useEffect, useRef } from 'react';
import { attachHiDPICanvas } from '@/lib/vis/canvasKit';

interface PanelProps {
  className?: string;
}

export function FrequenciesPanel({ className }: PanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return attachHiDPICanvas(canvas, (ctx) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    });
  }, []);

  return (
    <article className={className}>
      <div className="card__hd">Frequencies</div>
      <div className="card__bd visual tall">
        <canvas ref={canvasRef} />
      </div>
    </article>
  );
}
