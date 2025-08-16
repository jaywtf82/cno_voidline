
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePhase2Metrics, usePhase2Source } from '@/state/useSessionStore';

export function StereoCorrelationMeter() {
  const metrics = usePhase2Metrics();
  const phase2Source = usePhase2Source();
  
  const themeClass = phase2Source === 'post' ? 'text-cyan-400 border-cyan-400' : 'text-orange-400 border-orange-400';

  return (
    <Card className="border-gray-700 bg-black/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-white">Stereo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">Correlation</span>
            <span className={`text-sm font-mono ${themeClass}`}>
              {metrics.corr.toFixed(2)}
            </span>
          </div>
          
          <div className="w-full bg-gray-800 rounded h-2">
            <div 
              className={`h-full rounded transition-all duration-300 ${
                phase2Source === 'post' ? 'bg-cyan-400' : 'bg-orange-400'
              }`}
              style={{ width: `${((metrics.corr + 1) / 2) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">Width</span>
          <span className={`text-sm font-mono ${themeClass}`}>
            {metrics.widthPct.toFixed(0)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
