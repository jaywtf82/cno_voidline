import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Phase1DeepSignal } from '@/components/mastering/Phase1DeepSignal';

/**
 * MasteringProcess - Main mastering workflow page
 * Uses AppShell for exact header parity with main page
 */
export default function MasteringProcess() {
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
            Deep signal deconstruction and AI-powered audio enhancement
          </p>
        </div>
        
        {/* Phase 1: Deep Signal Deconstruction */}
        <Phase1DeepSignal />
      </div>
    </AppShell>
  );
}