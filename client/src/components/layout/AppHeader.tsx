import React from 'react';
import { Link, useLocation } from 'wouter';
import { Logo } from '../Logo';
import { Button } from '../ui/button';
import { 
  FileAudio, 
  Settings, 
  Headphones,
  Activity,
  Upload,
  Sliders
} from 'lucide-react';

/**
 * AppHeader - Unified header component used across all pages
 * Maintains exact visual parity and navigation behavior
 */
export function AppHeader() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path || location.startsWith(path + '/');
  };

  return (
    <header className="terminal-window border-b-2 border-terminal-border">
      <div className="terminal-header">
        {/* macOS-style window controls */}
        <div className="terminal-dots">
          <div className="terminal-dot terminal-dot--red" />
          <div className="terminal-dot terminal-dot--yellow" />
          <div className="terminal-dot terminal-dot--green" />
        </div>
        
        {/* Logo */}
        <div className="flex items-center ml-6">
          <Logo className="h-8 w-auto" />
        </div>
        
        <div className="terminal-title">
          C/No VOIDLINE - AI Audio Mastering Console
        </div>
        
        {/* Navigation */}
        <nav className="flex items-center gap-4 ml-auto">
          <Link href="/">
            <Button
              variant={isActive('/') && location === '/' ? 'default' : 'ghost'}
              size="sm"
              className="btn-terminal btn-terminal--secondary text-xs font-mono"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </Link>
          
          <Link href="/mastering">
            <Button
              variant={isActive('/mastering') ? 'default' : 'ghost'}
              size="sm"
              className="btn-terminal btn-terminal--secondary text-xs font-mono"
            >
              <Headphones className="w-4 h-4" />
              Mastering
            </Button>
          </Link>
          
          <Link href="/console">
            <Button
              variant={isActive('/console') ? 'default' : 'ghost'}
              size="sm"
              className="btn-terminal btn-terminal--secondary text-xs font-mono"
            >
              <Activity className="w-4 h-4" />
              Console
            </Button>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            className="btn-terminal btn-terminal--secondary text-xs font-mono"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </nav>
      </div>
    </header>
  );
}
import { useLocation, useNavigate } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export function AppHeader() {
  const [location] = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleLogin = async () => {
    try {
      window.location.href = '/api/login';
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <header
      className="app-header site-header"
      role="banner"
      aria-label="Primary"
    >
      <div className="header-inner terminal-window">
        <a href="/" className="brand group" aria-label="Homepage">
          <span className="sig">[-]</span>
          <div className="brand-copy">
            <h1 className="brand-title">./C/No_Voidline</h1>
            <p className="brand-sub">Frequencies attained. Stillness remains.</p>
          </div>
        </a>

        <nav className="nav" aria-label="Main navigation">
          <a className="nav-link" href="/" data-active={location === '/' ? 'true' : 'false'}>/home</a>
          <a className="nav-link" href="/console" data-active={location === '/console' ? 'true' : 'false'}>/console</a>
          <a className="nav-link" href="/#features">/features</a>
          <a className="nav-link" href="/#pricing">/pricing</a>
          <a className="nav-link" href="/#docs">/docs</a>
          <a className="nav-link" href="/#logs">/logs</a>
        </nav>

        <div className="actions">
          {!isAuthenticated && (
            <button
              onClick={handleLogin}
              className="btn btn-ghost"
            >
              Login
            </button>
          )}
          <div className="header-lights" data-role="traffic-lights">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
        </div>
      </div>
    </header>
  );
}
