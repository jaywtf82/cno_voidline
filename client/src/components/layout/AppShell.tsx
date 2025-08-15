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
import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell h-[100dvh] overflow-hidden bg-[var(--bg)] text-[var(--text)] antialiased">
      {/* Fixed/Sticky Header */}
      <AppHeader />

      {/* Scroll area: body content scrolls under header */}
      <main id="app-main" className="app-main">
        {children}
      </main>
    </div>
  );
}
