
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessionStore, usePhase2Source } from '@/state/useSessionStore';

export function VoidlineScore() {
  const voidlineScore = useSessionStore(state => state.voidlineScore);
  const phase2Source = usePhase2Source();
  
  const themeClass = phase2Source === 'post' ? 'text-cyan-400' : 'text-orange-400';

  return (
    <Card className="border-gray-700 bg-black/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-white">Voidline Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className={`text-3xl font-bold ${themeClass}`}>
            {Math.round(voidlineScore * 100)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            /100
          </div>
        </div>
        
        <div className="mt-3 w-full bg-gray-800 rounded h-2">
          <div 
            className={`h-full rounded transition-all duration-500 ${
              phase2Source === 'post' ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' : 'bg-gradient-to-r from-orange-600 to-orange-400'
            }`}
            style={{ width: `${voidlineScore * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
