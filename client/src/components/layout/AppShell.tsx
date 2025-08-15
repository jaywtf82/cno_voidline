import React from 'react';
import { AppHeader } from './AppHeader';
import { ToastStack } from '../system/ToastStack';
import { LiveFeedTerminal } from '../system/LiveFeedTerminal';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AppShell - Unified layout wrapper for all pages
 * Ensures visual parity by using the same header component across all pages
 */
export function AppShell({ children, className = '' }: AppShellProps) {
  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text">
      {/* Shared header - exact same component as main page */}
      <AppHeader />
      
      {/* Main content area */}
      <main className={`relative ${className}`}>
        {children}
      </main>
      
      {/* Toast positioning anchor */}
      <ToastStack />
      
      {/* Unified live feed terminal - positioned below toasts */}
      <LiveFeedTerminal />
    </div>
  );
}