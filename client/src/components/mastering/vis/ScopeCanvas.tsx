import React, { useRef, useEffect, useState } from 'react';
import { attachHiDPICanvas } from "@/lib/ui/resizeCanvas";

interface ScopeCanvasProps {
  width: number;
  height: number;
  isActive: boolean;
}

/**
 * ScopeCanvas - Vectorscope and correlation display
 * Shows stereo imaging and phase relationships
 */
export function ScopeCanvas({ width, height, isActive }: ScopeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [scopeData, setScopeData] = useState<{ left: number[]; right: number[] }>({
    left: new Array(256).fill(0),
    right: new Array(256).fill(0)
  });
  useEffect(() => {
    if (!canvasRef.current) return;
    const detach = attachHiDPICanvas(canvasRef.current);
    return detach;
  }, []);
  
  // Generate realistic stereo scope data
  const generateScopeData = () => {
    const time = Date.now() * 0.001;
    const samples = 256;
    
    const left: number[] = [];
    const right: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      
      // Realistic stereo signal with some correlation
      const mono = Math.sin(t * Math.PI * 4 + time) * 0.4;
      const stereoL = Math.sin(t * Math.PI * 6 + time * 1.1) * 0.3;
      const stereoR = Math.sin(t * Math.PI * 6 + time * 0.9) * 0.3;
      
      left[i] = mono + stereoL + (Math.random() - 0.5) * 0.1;
      right[i] = mono + stereoR + (Math.random() - 0.5) * 0.1;
      
      // Keep in range
      left[i] = Math.max(-1, Math.min(1, left[i]));
      right[i] = Math.max(-1, Math.min(1, right[i]));
    }
    
    return { left, right };
  };
  
  const drawScope = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(10, 10, 10, 1)';
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;
    
    // Grid circles
    ctx.strokeStyle = 'rgba(51, 51, 51, 0.3)';
    ctx.lineWidth = 1;
    
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 3) * i, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Grid lines (L/R axes)
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    
    // Diagonal lines for phase reference
    ctx.moveTo(centerX - radius * 0.7, centerY - radius * 0.7);
    ctx.lineTo(centerX + radius * 0.7, centerY + radius * 0.7);
    ctx.moveTo(centerX - radius * 0.7, centerY + radius * 0.7);
    ctx.lineTo(centerX + radius * 0.7, centerY - radius * 0.7);
    ctx.stroke();
    
    if (isActive) {
      // Draw vectorscope dots
      ctx.fillStyle = '#22c55e';
      
      for (let i = 0; i < scopeData.left.length; i++) {
        const left = scopeData.left[i];
        const right = scopeData.right[i];
        
        const x = centerX + left * radius;
        const y = centerY + right * radius;
        
        // Vary opacity based on amplitude
        const amplitude = Math.sqrt(left * left + right * right);
        ctx.globalAlpha = amplitude * 0.6 + 0.2;
        
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
      
      // Correlation value display
      const correlation = calculateCorrelation(scopeData.left, scopeData.right);
      
      ctx.fillStyle = '#22c55e';
      ctx.font = '12px Fira Code';
      ctx.textAlign = 'left';
      ctx.fillText(`Correlation: ${correlation.toFixed(3)}`, 10, 20);
      
      // Stereo width indicator
      const stereoWidth = calculateStereoWidth(scopeData.left, scopeData.right);
      ctx.fillText(`Width: ${stereoWidth.toFixed(2)}`, 10, 40);
      
      // Phase indicator
      const phase = calculatePhase(scopeData.left, scopeData.right);
      ctx.fillText(`Phase: ${phase.toFixed(1)}°`, 10, 60);
    }
    
    // Labels
    ctx.fillStyle = '#888888';
    ctx.font = '10px Fira Code';
    ctx.textAlign = 'center';
    
    ctx.fillText('L', centerX - radius - 15, centerY + 3);
    ctx.fillText('R', centerX + radius + 15, centerY + 3);
    ctx.fillText('+', centerX + 3, centerY - radius - 8);
    ctx.fillText('-', centerX + 3, centerY + radius + 15);
  };
  
  // Calculate stereo correlation
  const calculateCorrelation = (left: number[], right: number[]): number => {
    let sumLR = 0, sumL = 0, sumR = 0, sumL2 = 0, sumR2 = 0;
    
    for (let i = 0; i < left.length; i++) {
      sumLR += left[i] * right[i];
      sumL += left[i];
      sumR += right[i];
      sumL2 += left[i] * left[i];
      sumR2 += right[i] * right[i];
    }
    
    const n = left.length;
    const numerator = n * sumLR - sumL * sumR;
    const denominator = Math.sqrt((n * sumL2 - sumL * sumL) * (n * sumR2 - sumR * sumR));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };
  
  // Calculate stereo width
  const calculateStereoWidth = (left: number[], right: number[]): number => {
    let sumSide = 0, sumMid = 0;
    
    for (let i = 0; i < left.length; i++) {
      const mid = (left[i] + right[i]) / 2;
      const side = (left[i] - right[i]) / 2;
      
      sumMid += mid * mid;
      sumSide += side * side;
    }
    
    return sumMid === 0 ? 0 : Math.sqrt(sumSide / sumMid);
  };
  
  // Calculate phase difference
  const calculatePhase = (left: number[], right: number[]): number => {
    const correlation = calculateCorrelation(left, right);
    return Math.acos(Math.abs(correlation)) * (180 / Math.PI);
  };
  
  useEffect(() => {
    const animate = () => {
      if (isActive) {
        setScopeData(generateScopeData());
      }
      drawScope();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, width, height]);
  
  return (
    <canvas
        ref={canvasRef}
        className="border border-terminal-border rounded-md bg-terminal-bg"
        style={{ width, height }}
      />
  );
}