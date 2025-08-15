import React from 'react';
import { useLocation } from 'wouter';
import { AppShell } from '@/components/layout/AppShell';
import { Phase1DeepSignal } from '@/components/mastering/Phase1DeepSignal';
import Phase2Reconstruction from '@/components/mastering/Phase2Reconstruction';
import { useMasteringStore } from '@/state/masteringStore';

/**
 * MasteringProcess - Main mastering workflow page
 * Uses AppShell for exact header parity with main page
 */
export default function MasteringProcess() {
  const { currentSession, createSession } = useMasteringStore();
  const [location] = useLocation();
  
  // Extract session ID from URL or use current session
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const urlSessionId = urlParams.get('id');
  const sessionId = urlSessionId || currentSession?.id || 'default';

  // Initialize session if needed
  React.useEffect(() => {
    if (urlSessionId && !currentSession) {
      // Create a minimal session from URL parameter
      createSession({ name: `Session ${urlSessionId}` }, null);
    }
  }, [urlSessionId, currentSession, createSession]);

  return (
    <AppShell className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-terminal-lg mb-2">
            <span className="status-indicator status-indicator--active" />
            Mastering Process
          </h1>
          <p className="text-terminal-sm">
            Deep signal deconstruction and AI-powered audio enhancement • Session: {sessionId}
          </p>
        </div>
        
        {/* Phase 1: Deep Signal Deconstruction */}
        <Phase1DeepSignal />
        
        {/* Phase 2: Intelligent Reconstruction */}
        <div className="mt-8">
          <Phase2Reconstruction sessionId={sessionId} />
        </div>
      </div>
    </AppShell>
  );
}