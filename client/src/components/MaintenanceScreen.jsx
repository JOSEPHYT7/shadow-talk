import React, { useState, useEffect } from 'react';
import { RefreshCw, KeyRound, X, Lock, ArrowRight, ShieldAlert, AlertTriangle, Calendar, Clock, Terminal } from 'lucide-react';

/* ==========================================================================
   Pure Pixel-Art Ghost SVG Components (Faithful to Reference Art)
   ========================================================================== */

export function PixelGhostLeader({ size = 110, className = "" }) {
  return (
    <svg
      viewBox="0 0 20 22"
      width={size}
      height={Math.round(size * 1.1)}
      shapeRendering="crispEdges"
      className={`pixel-ghost-svg ${className}`}
    >
      {/* Dark Outline #0d2f36 */}
      <rect x="7" y="1" width="6" height="1" fill="#0d2f36" />
      <rect x="5" y="2" width="2" height="1" fill="#0d2f36" />
      <rect x="13" y="2" width="2" height="1" fill="#0d2f36" />
      <rect x="4" y="3" width="1" height="2" fill="#0d2f36" />
      <rect x="15" y="3" width="1" height="2" fill="#0d2f36" />

      {/* Outstretched Left Arm */}
      <rect x="2" y="5" width="2" height="1" fill="#0d2f36" />
      <rect x="1" y="6" width="1" height="3" fill="#0d2f36" />
      <rect x="2" y="9" width="2" height="1" fill="#0d2f36" />

      {/* Outstretched Right Arm */}
      <rect x="16" y="5" width="2" height="1" fill="#0d2f36" />
      <rect x="18" y="6" width="1" height="3" fill="#0d2f36" />
      <rect x="16" y="9" width="2" height="1" fill="#0d2f36" />

      {/* Body Sides */}
      <rect x="4" y="10" width="1" height="6" fill="#0d2f36" />
      <rect x="15" y="10" width="1" height="6" fill="#0d2f36" />

      {/* 3-Peak Wavy Skirt Bottom Outline */}
      <rect x="4" y="16" width="3" height="1" fill="#0d2f36" />
      <rect x="7" y="15" width="1" height="1" fill="#0d2f36" />
      <rect x="8" y="14" width="1" height="1" fill="#0d2f36" />
      <rect x="9" y="15" width="2" height="1" fill="#0d2f36" />
      <rect x="11" y="14" width="1" height="1" fill="#0d2f36" />
      <rect x="12" y="15" width="1" height="1" fill="#0d2f36" />
      <rect x="13" y="16" width="3" height="1" fill="#0d2f36" />

      {/* Body Fill: Crisp White #ffffff */}
      <rect x="7" y="2" width="6" height="1" fill="#ffffff" />
      <rect x="5" y="3" width="10" height="2" fill="#ffffff" />
      <rect x="4" y="5" width="12" height="1" fill="#ffffff" />
      <rect x="2" y="6" width="16" height="3" fill="#ffffff" />
      <rect x="4" y="9" width="12" height="3" fill="#ffffff" />

      {/* Eyes: Vertical Dark Pills #0d2228 */}
      <rect x="7" y="5" width="1" height="3" fill="#0d2228" />
      <rect x="12" y="5" width="1" height="3" fill="#0d2228" />

      {/* Lower Body / Skirt Shading & Dithering */}
      <rect x="5" y="12" width="10" height="1" fill="#ffffff" />
      <rect x="6" y="12" width="1" height="1" fill="#ede8dc" />
      <rect x="10" y="12" width="1" height="1" fill="#ede8dc" />
      <rect x="13" y="12" width="1" height="1" fill="#ede8dc" />

      <rect x="5" y="13" width="10" height="1" fill="#ede8dc" />
      <rect x="5" y="13" width="1" height="1" fill="#ffffff" />
      <rect x="8" y="13" width="1" height="1" fill="#cfc7b4" />
      <rect x="12" y="13" width="1" height="1" fill="#ffffff" />

      <rect x="5" y="14" width="10" height="1" fill="#cfc7b4" />
      <rect x="7" y="14" width="1" height="1" fill="#ede8dc" />
      <rect x="11" y="14" width="1" height="1" fill="#ede8dc" />

      <rect x="5" y="15" width="2" height="1" fill="#9bb2b5" />
      <rect x="9" y="14" width="2" height="1" fill="#9bb2b5" />
      <rect x="13" y="15" width="2" height="1" fill="#9bb2b5" />
    </svg>
  );
}

export function PixelGhostCurious({ size = 95, className = "" }) {
  return (
    <svg
      viewBox="0 0 18 20"
      width={size}
      height={Math.round(size * 1.11)}
      shapeRendering="crispEdges"
      className={`pixel-ghost-svg ${className}`}
    >
      {/* Dark Outline #0d2f36 */}
      <rect x="6" y="1" width="6" height="1" fill="#0d2f36" />
      <rect x="4" y="2" width="2" height="1" fill="#0d2f36" />
      <rect x="12" y="2" width="2" height="1" fill="#0d2f36" />
      <rect x="3" y="3" width="1" height="2" fill="#0d2f36" />
      <rect x="14" y="3" width="1" height="2" fill="#0d2f36" />

      {/* Cute left shoulder notch */}
      <rect x="2" y="5" width="1" height="3" fill="#0d2f36" />
      <rect x="3" y="8" width="1" height="7" fill="#0d2f36" />
      <rect x="14" y="5" width="1" height="10" fill="#0d2f36" />

      {/* 4-Wave Scalloped Skirt Bottom */}
      <rect x="4" y="15" width="2" height="1" fill="#0d2f36" />
      <rect x="6" y="14" width="1" height="1" fill="#0d2f36" />
      <rect x="7" y="15" width="2" height="1" fill="#0d2f36" />
      <rect x="9" y="14" width="1" height="1" fill="#0d2f36" />
      <rect x="10" y="15" width="2" height="1" fill="#0d2f36" />
      <rect x="12" y="14" width="1" height="1" fill="#0d2f36" />
      <rect x="13" y="15" width="2" height="1" fill="#0d2f36" />

      {/* Body Fill */}
      <rect x="6" y="2" width="6" height="1" fill="#ffffff" />
      <rect x="4" y="3" width="10" height="2" fill="#ffffff" />
      <rect x="3" y="5" width="11" height="3" fill="#ffffff" />
      <rect x="4" y="8" width="10" height="4" fill="#ffffff" />

      {/* Face: • _ • Expression */}
      <rect x="5" y="6" width="1" height="2" fill="#0d2228" />
      <rect x="10" y="6" width="1" height="2" fill="#0d2228" />
      <rect x="7" y="8" width="2" height="1" fill="#0d2228" />

      {/* Lower Body Shading */}
      <rect x="4" y="12" width="10" height="1" fill="#ede8dc" />
      <rect x="5" y="12" width="1" height="1" fill="#ffffff" />
      <rect x="11" y="12" width="1" height="1" fill="#ffffff" />

      <rect x="4" y="13" width="10" height="1" fill="#cfc7b4" />
      <rect x="7" y="13" width="1" height="1" fill="#ede8dc" />
      <rect x="9" y="13" width="1" height="1" fill="#ede8dc" />

      <rect x="4" y="14" width="2" height="1" fill="#9bb2b5" />
      <rect x="7" y="14" width="2" height="1" fill="#9bb2b5" />
      <rect x="10" y="14" width="2" height="1" fill="#9bb2b5" />
      <rect x="13" y="14" width="1" height="1" fill="#9bb2b5" />
    </svg>
  );
}

export function PixelGhostSparkle({ size = 115, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`pixel-ghost-svg sparkle-ghost ${className}`}
    >
      {/* Glowing Floating Pixel Sparkles Around Head */}
      <rect x="2" y="5" width="1" height="1" fill="#6fe3db" className="ghost-sparkle s1" />
      <rect x="3" y="2" width="1" height="2" fill="#ffffff" className="ghost-sparkle s2" />
      <rect x="6" y="1" width="1" height="1" fill="#2d9494" className="ghost-sparkle s3" />
      <rect x="9" y="0" width="2" height="1" fill="#6fe3db" className="ghost-sparkle s1" />
      <rect x="14" y="1" width="1" height="1" fill="#ffffff" className="ghost-sparkle s4" />
      <rect x="17" y="2" width="1" height="2" fill="#6fe3db" className="ghost-sparkle s2" />
      <rect x="20" y="4" width="2" height="1" fill="#ffffff" className="ghost-sparkle s3" />
      <rect x="21" y="7" width="1" height="1" fill="#2d9494" className="ghost-sparkle s1" />
      <rect x="1" y="8" width="1" height="1" fill="#2d9494" className="ghost-sparkle s4" />
      <rect x="20" y="10" width="1" height="1" fill="#6fe3db" className="ghost-sparkle s2" />

      {/* Body Outline #0d2f36 */}
      <rect x="8" y="4" width="8" height="1" fill="#0d2f36" />
      <rect x="6" y="5" width="2" height="1" fill="#0d2f36" />
      <rect x="16" y="5" width="2" height="1" fill="#0d2f36" />
      <rect x="5" y="6" width="1" height="12" fill="#0d2f36" />
      <rect x="18" y="6" width="1" height="12" fill="#0d2f36" />

      {/* Bottom Skirt with Center Inverted Arch Cutout */}
      <rect x="6" y="18" width="3" height="1" fill="#0d2f36" />
      <rect x="9" y="17" width="1" height="1" fill="#0d2f36" />
      <rect x="10" y="16" width="4" height="1" fill="#0d2f36" />
      <rect x="14" y="17" width="1" height="1" fill="#0d2f36" />
      <rect x="15" y="18" width="3" height="1" fill="#0d2f36" />

      {/* White Body Fill */}
      <rect x="8" y="5" width="8" height="1" fill="#ffffff" />
      <rect x="6" y="6" width="12" height="2" fill="#ffffff" />
      <rect x="6" y="8" width="12" height="6" fill="#ffffff" />

      {/* Big Retro Square Eyes */}
      <rect x="8" y="8" width="2" height="2" fill="#0d2228" />
      <rect x="14" y="8" width="2" height="2" fill="#0d2228" />

      {/* Lower Body / Skirt Shading */}
      <rect x="6" y="14" width="12" height="1" fill="#ede8dc" />
      <rect x="7" y="14" width="1" height="1" fill="#ffffff" />
      <rect x="15" y="14" width="1" height="1" fill="#ffffff" />

      <rect x="6" y="15" width="12" height="1" fill="#cfc7b4" />
      <rect x="9" y="15" width="1" height="1" fill="#ede8dc" />
      <rect x="13" y="15" width="1" height="1" fill="#ede8dc" />

      <rect x="6" y="16" width="4" height="1" fill="#9bb2b5" />
      <rect x="14" y="16" width="4" height="1" fill="#9bb2b5" />
      <rect x="6" y="17" width="3" height="1" fill="#9bb2b5" />
      <rect x="15" y="17" width="3" height="1" fill="#9bb2b5" />
    </svg>
  );
}

/* ==========================================================================
   Main MaintenanceScreen Component
   ========================================================================== */

export default function MaintenanceScreen({ maintenance, onRefresh, onOverrideSuccess, serverUrl }) {
  const [checking, setChecking] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overridePassword, setOverridePassword] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState('');

  // Live Real-Time Date & Clock
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Real-Time Countdown Timer (Syncs with maintenance.estimatedEnd or 44m 59s initial timer)
  const [countdownSeconds, setCountdownSeconds] = useState(() => {
    if (maintenance?.estimatedEnd) {
      const diff = Math.max(0, Math.floor((new Date(maintenance.estimatedEnd) - Date.now()) / 1000));
      if (diff > 0) return diff;
    }
    return 44 * 60 + 59;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setCountdownSeconds((prev) => {
        if (maintenance?.estimatedEnd) {
          const diff = Math.max(0, Math.floor((new Date(maintenance.estimatedEnd) - Date.now()) / 1000));
          return diff;
        }
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [maintenance?.estimatedEnd]);

  const handleCheck = async () => {
    setChecking(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setChecking(false), 800);
  };

  const handleOverrideSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanKey = (overridePassword || '').trim();
    if (!cleanKey) {
      setOverrideError('Please enter the 10-character emergency override key.');
      return;
    }

    setOverrideLoading(true);
    setOverrideError('');

    try {
      const baseUrl = serverUrl || (typeof window !== 'undefined' && window.location.origin) || '';
      const res = await fetch(`${baseUrl}/api/maintenance/override-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: cleanKey })
      });

      const data = await res.json();
      if (res.ok && data.success && data.adminToken) {
        try {
          sessionStorage.setItem('shadowtalk_admin_token', data.adminToken);
          sessionStorage.setItem('shadowtalk_admin_panel_open', 'true');
          localStorage.setItem('shadowtalk_admin_token', data.adminToken);
          localStorage.setItem('shadowtalk_admin_panel_open', 'true');
        } catch { }

        if (typeof onOverrideSuccess === 'function') {
          onOverrideSuccess(data.adminToken);
        } else {
          window.location.reload();
        }
      } else {
        setOverrideError(data.error || 'Invalid emergency override key. Access denied.');
      }
    } catch (err) {
      setOverrideError('Connection error validating emergency key: ' + err.message);
    } finally {
      setOverrideLoading(false);
    }
  };

  // Helper date formatting
  const formatDateString = (d) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dayName = days[d.getDay()];
    const dateNum = String(d.getDate()).padStart(2, '0');
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    return `${dayName}, ${dateNum} ${monthName} ${year}`;
  };

  const formatCountdownString = (totalSecs) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatTimeString = (d) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  return (
    <div className="reddit-maintenance-viewport">
      {/* Dynamic Retro Pixel Mosaic Background Grid with Floating Pixels */}
      <div className="pixel-mosaic-bg">
        <div className="pixel-block pb1" />
        <div className="pixel-block pb2" />
        <div className="pixel-block pb3" />
        <div className="pixel-block pb4" />
        <div className="pixel-block pb5" />
        <div className="pixel-block pb6" />
        <div className="pixel-block pb7" />
        <div className="pixel-block pb8" />
        <div className="pixel-block pb9" />
        <div className="pixel-block pb10" />
        <div className="pixel-block pb11" />
        <div className="pixel-block pb12" />
        <div className="pixel-block pb13" />
        <div className="pixel-block pb14" />
        <div className="pixel-block pb15" />
        <div className="pixel-block pb16" />
      </div>

      {/* Roaming Pixel Ghosts Floating Freely Across the Page */}
      <div className="roaming-ghosts-container" aria-hidden="true">
        {/* Roaming Ghost 1: Leader Ghost gliding across top/middle */}
        <div
          className="roaming-ghost ghost-roamer-1 secret-triggerable"
          onClick={() => setShowOverrideModal(true)}
          title="Roaming Pixel Ghost (Click for Council Override)"
          role="button"
          tabIndex={0}
        >
          <PixelGhostLeader size={72} />
          <span className="roaming-ghost-tag">ROAMING // 01</span>
        </div>

        {/* Roaming Ghost 2: Curious Ghost wandering across bottom/left */}
        <div
          className="roaming-ghost ghost-roamer-2 secret-triggerable"
          onClick={() => setShowOverrideModal(true)}
          title="Roaming Pixel Ghost (Click for Council Override)"
          role="button"
          tabIndex={0}
        >
          <PixelGhostCurious size={62} />
          <span className="roaming-ghost-tag">ROAMING // 02</span>
        </div>

        {/* Roaming Ghost 3: Sparkling Ghost floating across right region */}
        <div
          className="roaming-ghost ghost-roamer-3 secret-triggerable"
          onClick={() => setShowOverrideModal(true)}
          title="Roaming Pixel Ghost (Click for Council Override)"
          role="button"
          tabIndex={0}
        >
          <PixelGhostSparkle size={78} />
          <span className="roaming-ghost-tag">ROAMING // 03</span>
        </div>

        {/* Roaming Ghost 4: Ambient Mini Ghost drifting in the deep distance */}
        <div
          className="roaming-ghost ghost-roamer-4 secret-triggerable"
          onClick={() => setShowOverrideModal(true)}
          title="Deep Roaming Ghost (Click for Council Override)"
          role="button"
          tabIndex={0}
        >
          <PixelGhostLeader size={46} className="ghost-mini" />
        </div>
      </div>

      <div className="reddit-maintenance-center">
        {/* Pixel Ghost Trio Mascot Pedestal (Secret triggerable on click) */}
        <div
          className="pixel-mascot-container pixel-ghosts-trio secret-triggerable"
          onClick={() => setShowOverrideModal(true)}
          title="Pixel Ghost Council Enclave (Click to unlock)"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') setShowOverrideModal(true); }}
        >
          <div className="ghost-trio-member ghost-trio-left" title="Curious Pixel Ghost">
            <PixelGhostCurious size={72} />
          </div>
          <div className="ghost-trio-member ghost-trio-center" title="Leader Pixel Ghost">
            <PixelGhostLeader size={118} />
          </div>
          <div className="ghost-trio-member ghost-trio-right" title="Sparkling Pixel Ghost">
            <PixelGhostSparkle size={92} />
          </div>
        </div>

        {/* 8-Bit Retro Titles */}
        <h1 className="pixel-main-title">SHADOWTALK IS DOWN</h1>
        <h2 className="pixel-sub-title">FOR AN EMERGENCY MAINTENANCE</h2>

        {/* Retro Arcade Terminal HUD: Live Date & Countdown Timer */}
        <div className="pixel-hud-terminal">
          <div className="pixel-hud-header">
            <div className="hud-terminal-tag">
              <span>NODE RESYNC ACTIVE</span>
            </div>
          </div>

          <div className="pixel-hud-grid">
            <div className="pixel-hud-card date-card">
              <div className="hud-card-label">
                <Calendar size={12} className="hud-icon" />
                <span>SYSTEM DATE</span>
              </div>
              <div className="hud-card-value date-glow">
                {formatDateString(currentTime)}
              </div>
              <div className="hud-card-sub">
                LOCAL TIME: <span className="hud-sub-time">{formatTimeString(currentTime)}</span>
              </div>
            </div>

            <div className="pixel-hud-card timer-card">
              <div className="hud-card-label">
                <Clock size={12} className="hud-icon" />
                <span>COUNTDOWN TIMER</span>
              </div>
              <div className="hud-card-value timer-glow">
                <span className="timer-ticking-digits">{formatCountdownString(countdownSeconds)}</span>
              </div>
              <div className="hud-card-sub">
                ESTIMATED RESTORATION
              </div>
            </div>
          </div>
        </div>

        {/* Whisper Note with Interactive Envelope Icon */}
        <p className="pixel-whisper-text">
          I WONDER IF YOU&apos;LL HAVE A{' '}
          <button
            type="button"
            className="pixel-envelope-btn secret-triggerable"
            onClick={() => setShowOverrideModal(true)}
            aria-label="Secret Dispatch Override"
          >
            <span className="pixel-envelope-icon">✉</span>
          </button>{' '}
          WHEN SHADOWTALK&apos;S BACK?
        </p>

        {/* Retro Arcade Status Refresh Control */}
        <div className="pixel-status-action">
          <button
            type="button"
            className="pixel-recheck-btn"
            onClick={handleCheck}
            disabled={checking}
          >
            <RefreshCw size={12} className={checking ? 'spin-icon' : ''} />
            <span>{checking ? 'PINGING RELAYS...' : 'RECHECK RELAY STATUS'}</span>
          </button>
        </div>
      </div>

      {/* Secret Emergency Override 10-Character Password Modal Popup */}
      {showOverrideModal && (
        <div className="maintenance-override-backdrop" onClick={() => setShowOverrideModal(false)}>
          <div className="maintenance-override-card pixel-override-theme" onClick={(e) => e.stopPropagation()}>
            <div className="override-card-header">
              <div className="override-header-left">
                <div className="override-shield-wrap">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="override-title">&gt;&gt; EMERGENCY COUNCIL OVERRIDE &lt;&lt;</h3>
                  <span className="override-subtitle">10-Character Direct Bypass Terminal</span>
                </div>
              </div>
              <button
                type="button"
                className="override-close-btn"
                onClick={() => setShowOverrideModal(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="override-form">
              <p className="override-prompt-text">
                Enter the exact <strong>10-character emergency bypass key</strong> generated when maintenance mode was engaged in the Admin Panel.
              </p>

              <div className="override-input-group">
                <Lock size={15} className="override-lock-icon" />
                <input
                  type="text"
                  autoFocus
                  maxLength={16}
                  className="override-key-input"
                  placeholder="Enter 10-char override key..."
                  value={overridePassword}
                  onChange={(e) => setOverridePassword(e.target.value)}
                  disabled={overrideLoading}
                />
              </div>

              {overrideError && (
                <div className="override-error-banner">
                  <AlertTriangle size={14} />
                  <span>{overrideError}</span>
                </div>
              )}

              <div className="override-actions-row">
                <button
                  type="button"
                  className="override-cancel-btn"
                  onClick={() => setShowOverrideModal(false)}
                  disabled={overrideLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="override-submit-btn"
                  disabled={overrideLoading || !overridePassword.trim()}
                >
                  {overrideLoading ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={14} />
                      <span>Unlock Admin Terminal</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
