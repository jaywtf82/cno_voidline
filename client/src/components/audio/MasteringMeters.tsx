
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePhase2Metrics, usePhase2Source } from '@/state/useSessionStore';

export function MasteringMeters() {
  const metrics = usePhase2Metrics();
  const phase2Source = usePhase2Source();
  
  const themeClass = phase2Source === 'post' ? 'text-cyan-400' : 'text-orange-400';

  return (
    <Card className="border-gray-700 bg-black/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-white">Meters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">Peak</span>
          <span className={`text-sm font-mono ${themeClass}`}>
            {metrics.peakDb.toFixed(1)} dB
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">RMS</span>
          <span className={`text-sm font-mono ${themeClass}`}>
            {metrics.rmsDb.toFixed(1)} dB
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">LUFS-I</span>
          <span className={`text-sm font-mono ${themeClass}`}>
            {metrics.lufsI.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">Headroom</span>
          <span className={`text-sm font-mono ${themeClass}`}>
            {metrics.headroomDb.toFixed(1)} dB
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
