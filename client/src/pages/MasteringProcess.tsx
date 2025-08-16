
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Phase1DeepSignal from '@/components/mastering/Phase1DeepSignal';
import BlackroomPanel from '@/components/ui/BlackroomPanel';
import Phase2Reconstruction from '@/components/mastering/Phase2Reconstruction';
import TransmissionPanel from '@/components/export/TransmissionPanel';
import { useSessionStore, usePhase2Source } from '@/state/useSessionStore';

export default function MasteringProcess() {
  const phase2Source = usePhase2Source();
  const processedReady = useSessionStore(state => state.processedReady);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-black">
      {/* Minimal Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wider text-white">
              C/NO VOIDLINE MASTER
            </h1>
            <Badge variant="secondary" className="text-cyan-400 border-cyan-400/30">
              Demo Track • 24.8MB
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Phase 1: Technical Analysis */}
        <Card className="border-gray-800 bg-black/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-orange-400">Phase 1:</span>
              Technical Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Phase1DeepSignal />
          </CardContent>
        </Card>

        {/* Phase 2: BLACKROOM First, then Monitors */}
        <div className="space-y-6">
          <Card className="border-gray-800 bg-black/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-cyan-400">Phase 2:</span>
                Signal Modulation Zone
                {phase2Source === 'post' && (
                  <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
                    PREVIEW: PROCESSED
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BlackroomPanel />
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-black/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">
                Monitors & Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Phase2Reconstruction />
            </CardContent>
          </Card>
        </div>

        {/* Phase 3: Export Only */}
        <Card className="border-gray-800 bg-black/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-green-400">Phase 3:</span>
              Export Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TransmissionPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
