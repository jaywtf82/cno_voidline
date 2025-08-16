import React, { useRef, useEffect } from 'react';

interface VoidlineScoreProps {
  score: number;
}

export function VoidlineScore({ score }: VoidlineScoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw outer ring
    ctx.strokeStyle = '#0a4d2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw score arc
    const startAngle = -Math.PI / 2; // Start at top
    const endAngle = startAngle + (score / 100) * 2 * Math.PI;
    
    // Color based on score
    let scoreColor = '#ef4444'; // Red (poor)
    if (score >= 90) scoreColor = '#10b981'; // Green (excellent)
    else if (score >= 75) scoreColor = '#22c55e'; // Light green (good)
    else if (score >= 60) scoreColor = '#f59e0b'; // Yellow (fair)
    else if (score >= 40) scoreColor = '#f97316'; // Orange (poor)

    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 4, startAngle, endAngle);
    ctx.stroke();

    // Draw inner glow effect
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.8);
    gradient.addColorStop(0, scoreColor + '40');
    gradient.addColorStop(1, scoreColor + '00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.8, 0, 2 * Math.PI);
    ctx.fill();

    // Draw score text
    ctx.fillStyle = scoreColor;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(score.toFixed(1), centerX, centerY - 8);
    
    ctx.fillStyle = '#10b981';
    ctx.font = '10px monospace';
    ctx.fillText('VOIDLINE', centerX, centerY + 12);

    // Draw tick marks
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 100; i += 10) {
      const angle = startAngle + (i / 100) * 2 * Math.PI;
      const innerRadius = radius - 8;
      const outerRadius = radius - 2;
      
      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * outerRadius;
      const y2 = centerY + Math.sin(angle) * outerRadius;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

  }, [score]);

  const getScoreDescription = (score: number) => {
    if (score >= 90) return { text: 'EXCELLENT', color: 'text-green-400' };
    if (score >= 75) return { text: 'GOOD', color: 'text-green-300' };
    if (score >= 60) return { text: 'FAIR', color: 'text-yellow-400' };
    if (score >= 40) return { text: 'POOR', color: 'text-orange-400' };
    return { text: 'CRITICAL', color: 'text-red-400' };
  };

  const getScoreFactors = (score: number) => {
    if (score >= 90) return [
      'Optimal loudness balance',
      'Clean frequency response',
      'Good stereo imaging',
      'Minimal artifacts'
    ];
    if (score >= 75) return [
      'Good overall balance',
      'Minor EQ adjustments',
      'Acceptable dynamics',
      'Low distortion'
    ];
    if (score >= 60) return [
      'Needs EQ correction',
      'Dynamic range issues',
      'Some phase problems',
      'Moderate distortion'
    ];
    if (score >= 40) return [
      'Significant EQ needed',
      'Compression artifacts',
      'Phase correlation issues',
      'High distortion levels'
    ];
    return [
      'Major reconstruction needed',
      'Severe spectral imbalance',
      'Critical phase issues',
      'Excessive artifacts'
    ];
  };

  const scoreDesc = getScoreDescription(score);
  const factors = getScoreFactors(score);

  return (
    <div className="space-y-3">
      
      {/* Score visualization */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={120}
          height={120}
          className="w-24 h-24"
        />
      </div>

      {/* Score details */}
      <div className="text-center">
        <div className={`text-sm font-mono ${scoreDesc.color} mb-1`}>
          {scoreDesc.text}
        </div>
        <div className="text-xs text-gray-400">
          Analysis Score: {score.toFixed(1)}/100
        </div>
      </div>

      {/* Score factors */}
      <div className="space-y-1">
        <div className="text-xs font-mono text-green-300 mb-2">ANALYSIS FACTORS</div>
        <div className="bg-gray-800 p-2 rounded text-xs space-y-1">
          {factors.map((factor, index) => (
            <div key={index} className="flex items-center text-gray-300">
              <div className="w-1 h-1 bg-green-400 rounded-full mr-2 flex-shrink-0" />
              {factor}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-1">
        <div className="text-xs font-mono text-green-300 mb-2">RECOMMENDATIONS</div>
        <div className="bg-gray-800 p-2 rounded text-xs space-y-1">
          {score < 60 && (
            <div className="text-yellow-400">
              • Apply corrective EQ to problematic frequencies
            </div>
          )}
          {score < 75 && (
            <div className="text-yellow-400">
              • Check stereo phase correlation
            </div>
          )}
          {score < 90 && (
            <div className="text-green-400">
              • Fine-tune limiting threshold
            </div>
          )}
          {score >= 90 && (
            <div className="text-green-400">
              • Master is ready for distribution
            </div>
          )}
        </div>
      </div>

      {/* Scale reference */}
      <div className="text-xs text-gray-500 border-t border-green-800 pt-2">
        <div>90-100: Excellent (radio/streaming ready)</div>
        <div>75-89: Good (minor adjustments)</div>
        <div>60-74: Fair (needs work)</div>
        <div>40-59: Poor (major issues)</div>
        <div>&lt;40: Critical (reconstruction needed)</div>
      </div>
    </div>
  );
}