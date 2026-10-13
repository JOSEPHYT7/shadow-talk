import React from 'react';
import { ShieldAlert, ArrowLeft, Terminal, BookOpen, Compass } from 'lucide-react';

export default function NotFound404({ onNavigateChat, onNavigateManifesto }) {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/unknown';

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (onNavigateChat) {
      onNavigateChat();
    }
  };

  return (
    <div className="notfound-viewport">
      <div className="notfound-scanlines" />
      <div className="notfound-glow-sphere" />

      <div className="notfound-card">
        {/* Top Terminal Bar */}
        <div className="notfound-terminal-header">
          <div className="terminal-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <span className="terminal-title">ENCLAVE SECURE SHELL // ROUTE EXCEPTION</span>
          <span className="terminal-status-tag">CODE 404</span>
        </div>

        {/* Hero Cyber Graphic */}
        <div className="notfound-icon-wrap">
          <div className="notfound-radar-pulse" />
          <ShieldAlert size={48} className="notfound-icon" />
          <span className="notfound-glitch-code" data-text="404">404</span>
        </div>

        {/* Content */}
        <h1 className="notfound-title">Target Node Not Found</h1>
        <p className="notfound-desc">
          The requested relay address does not resolve to an active enclave chamber or encrypted stream.
        </p>

        {/* Diagnostic Trace Box */}
        <div className="notfound-trace-box">
          <div className="trace-line">
            <span className="trace-prompt">&gt;</span>
            <span className="trace-cmd">GET {currentPath}</span>
          </div>
          <div className="trace-line trace-err">
            <span className="trace-prompt">!</span>
            <span>ERR_RELAY_UNREACHABLE: Handshake timed out. No peer answered.</span>
          </div>
          <div className="trace-line trace-dim">
            <span className="trace-prompt">#</span>
            <span>Protocol: Zero-Knowledge Mesh Relay // Fallback recommended.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="notfound-actions">
          <button
            type="button"
            className="notfound-btn primary"
            onClick={onNavigateChat}
          >
            <Terminal size={16} />
            <span>Return to Secure Terminal</span>
          </button>

          {onNavigateManifesto && (
            <button
              type="button"
              className="notfound-btn secondary"
              onClick={onNavigateManifesto}
            >
              <BookOpen size={16} />
              <span>Read Manifesto</span>
            </button>
          )}

          <button
            type="button"
            className="notfound-btn ghost"
            onClick={handleBack}
          >
            <ArrowLeft size={16} />
            <span>Step Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
