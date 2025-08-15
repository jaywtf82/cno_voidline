import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export function AppHeader() {
  const [location] = useLocation();
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
