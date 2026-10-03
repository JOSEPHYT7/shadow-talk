import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'globe.gl';
import {
  Globe as GlobeIcon,
  Radio,
  Search,
  Crosshair,
  Shield,
  Activity,
  Layers,
  MapPin,
  RefreshCw,
  ExternalLink,
  Users,
  Wifi,
  Copy,
  Check,
  Clock,
  Navigation,
  Compass,
  Zap,
  Eye,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  UserCheck,
  FileText,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Minus,
  Maximize2
} from 'lucide-react';
import './GeoGlobe3D.css';

export default function GeoGlobe3D({ adminToken, serverUrl }) {
  const containerRef = useRef(null);
  const globeInstanceRef = useRef(null);

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'members' | 'users'
  const [ipstackConfigured, setIpstackConfigured] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [copiedField, setCopiedField] = useState(null);

  // Fetch visitors geolocation telemetry
  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${serverUrl}/api/admin/dashboard/geo-visitors`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out any relays or offline nodes: show ONLY real users present on site
        const list = (data.visitors || []).filter(v => !v.isRelay);
        setVisitors(list);
        setIpstackConfigured(Boolean(data.ipstackConfigured));

        // Auto-select admin / first live user if nothing selected yet
        if (list.length > 0 && !selectedVisitor) {
          const preferred = list.find(v => v.isCurrentAdmin) || list[0];
          setSelectedVisitor(preferred);
        }
      }
    } catch (err) {
      console.error('[GeoGlobe3D]: Failed to fetch geo-visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 10000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Globe.GL with realistic high-resolution Earth, atmosphere & controls
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous canvas
    containerRef.current.innerHTML = '';

    const width = containerRef.current.clientWidth || window.innerWidth - 380;
    const height = containerRef.current.clientHeight || window.innerHeight - 180;

    const globe = Globe({ animateIn: true })(containerRef.current)
      .globeImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/earth-topology.png')
      .backgroundImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('#38bdf8')
      .atmosphereAltitude(0.22)
      .width(width)
      .height(height);

    // Orbit controls with deep Google Maps-like zoom support
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
    controls.enableZoom = true;
    controls.minDistance = 101.5; // Allows deep zoom down to states/cities
    controls.maxDistance = 550;   // Outer orbital view
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Initial position showing global orientation
    globe.pointOfView({ lat: 20, lng: 78, altitude: 2.1 }, 1000);

    globeInstanceRef.current = globe;

    const handleResize = () => {
      if (containerRef.current && globeInstanceRef.current) {
        globeInstanceRef.current.width(containerRef.current.clientWidth);
        globeInstanceRef.current.height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (globeInstanceRef.current) {
        globeInstanceRef.current._destructor?.();
        globeInstanceRef.current = null;
      }
    };
  }, []);

  // Update HTML Pins, Radar Rings, and Relay Arcs when visitors or selected user changes
  useEffect(() => {
    if (!globeInstanceRef.current) return;
    const globe = globeInstanceRef.current;

    const validVisitors = visitors.filter(
      v => typeof v.latitude === 'number' && typeof v.longitude === 'number' && !isNaN(v.latitude) && !isNaN(v.longitude)
    );

    // 1. Interactive HTML Pins with Floating Avatars and Stalks (matching reference image)
    globe
      .htmlElementsData(validVisitors)
      .htmlLat(d => d.latitude)
      .htmlLng(d => d.longitude)
      .htmlAltitude(0.08)
      .htmlElement(d => {
        const pin = document.createElement('div');
        const isAdmin = Boolean(d.isCurrentAdmin || d.role === 'admin' || d.isAdmin);
        const isMember = Boolean(!isAdmin && (d.userTier === 'member' || d.isSocietyMember));
        const color = isAdmin ? '#ef4444' : isMember ? '#ffd700' : '#00f3ff';
        const isSelected = selectedVisitor?.id === d.id;

        pin.className = `globe-stalk-pin ${isSelected ? 'selected' : ''}`;
        pin.title = `@${d.alias} (${d.city || ''}, ${d.country || ''})`;

        const avatarInitial = (d.alias || 'U')[0].toUpperCase();
        const avatarContent = d.avatar
          ? `<img src="${d.avatar}" alt="${d.alias}" class="pin-avatar-img" />`
          : `<span class="pin-avatar-char">${avatarInitial}</span>`;

        pin.innerHTML = `
          <div class="pin-floating-container">
            <div class="pin-avatar-badge" style="border-color: ${color}; box-shadow: 0 0 ${isSelected ? '22px' : '10px'} ${color};">
              ${avatarContent}
              ${isAdmin ? '<span class="pin-badge-crown" title="Root Administrator">👑</span>' : isMember ? '<span class="pin-badge-seal" title="Secret Society Member">Ω</span>' : ''}
            </div>
            <div class="pin-alias-pill" style="border-color: ${color};">
              <span class="pin-dot" style="background: ${color};"></span>
              <span class="pin-alias-name">@${d.alias}</span>
            </div>
          </div>
          <div class="pin-stalk-stem" style="background: linear-gradient(to bottom, ${color}, rgba(${isAdmin ? '239, 68, 68' : isMember ? '255, 215, 0' : '0, 243, 255'}, 0.2));"></div>
          <div class="pin-ground-anchor" style="background: ${color}; box-shadow: 0 0 10px ${color};"></div>
        `;

        pin.onclick = (e) => {
          e.stopPropagation();
          flyToVisitor(d);
        };

        return pin;
      });

    // 2. Pulsing Radar Sensor Rings on Citizen Ground Coordinates
    globe
      .ringsData(validVisitors)
      .ringLat(d => d.latitude)
      .ringLng(d => d.longitude)
      .ringColor(d => {
        const isAdmin = Boolean(d.isCurrentAdmin || d.role === 'admin' || d.isAdmin);
        const isMember = Boolean(!isAdmin && (d.userTier === 'member' || d.isSocietyMember));
        return isAdmin ? '#ef4444' : isMember ? '#ffd700' : '#00f3ff';
      })
      .ringMaxRadius(4.0)
      .ringPropagationSpeed(1.4)
      .ringRepeatPeriod(1200);

    // 3. Arcs connecting citizens to the Root Admin / Central Node
    const adminNode = validVisitors.find(v => v.isCurrentAdmin);
    if (adminNode) {
      const arcLinks = validVisitors
        .filter(v => v.id !== adminNode.id)
        .map(v => {
          const isMember = Boolean(v.userTier === 'member' || v.isSocietyMember);
          return {
            startLat: adminNode.latitude,
            startLng: adminNode.longitude,
            endLat: v.latitude,
            endLng: v.longitude,
            color: isMember ? ['rgba(239, 68, 68, 0.8)', 'rgba(255, 215, 0, 0.8)'] : ['rgba(239, 68, 68, 0.8)', 'rgba(0, 243, 255, 0.8)']
          };
        });

      globe
        .arcsData(arcLinks)
        .arcStartLat(d => d.startLat)
        .arcStartLng(d => d.startLng)
        .arcEndLat(d => d.endLat)
        .arcEndLng(d => d.endLng)
        .arcColor(d => d.color)
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2000)
        .arcAltitudeAutoScale(0.28);
    } else {
      globe.arcsData([]);
    }
  }, [visitors, selectedVisitor]);

  // Handle auto-rotate toggle
  useEffect(() => {
    if (globeInstanceRef.current) {
      globeInstanceRef.current.controls().autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Smooth Google Earth-style camera flight to user coordinates
  const flyToVisitor = (v) => {
    setSelectedVisitor(v);
    setIsMinimized(false); // Auto-expand dossier when user is selected
    if (globeInstanceRef.current && typeof v.latitude === 'number' && typeof v.longitude === 'number') {
      globeInstanceRef.current.controls().autoRotate = false;
      setAutoRotate(false);
      // Zoom close to coordinates (altitude 0.35 allows inspecting state and city regions)
      globeInstanceRef.current.pointOfView({
        lat: v.latitude,
        lng: v.longitude,
        altitude: 0.35
      }, 1400);
    }
  };

  // Zoom back out to full orbital view
  const zoomGlobal = () => {
    if (globeInstanceRef.current) {
      globeInstanceRef.current.controls().autoRotate = true;
      setAutoRotate(true);
      globeInstanceRef.current.pointOfView({
        lat: 20,
        lng: 78,
        altitude: 2.1
      }, 1200);
    }
  };

  // Locate authenticated administrator
  const locateAdmin = () => {
    const adminNode = visitors.find(v => v.isCurrentAdmin);
    if (adminNode) {
      flyToVisitor(adminNode);
    } else if (visitors.length > 0) {
      flyToVisitor(visitors[0]);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filter visitors by roster tab and search query
  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      const isAdmin = Boolean(v.isCurrentAdmin || v.role === 'admin' || v.isAdmin);
      const isMember = Boolean(!isAdmin && (v.userTier === 'member' || v.isSocietyMember));

      if (filterType === 'members' && !isMember) return false;
      if (filterType === 'users' && (isMember || isAdmin)) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (v.alias && v.alias.toLowerCase().includes(q)) ||
        (v.city && v.city.toLowerCase().includes(q)) ||
        (v.country && v.country.toLowerCase().includes(q)) ||
        (v.ip && v.ip.toLowerCase().includes(q))
      );
    });
  }, [visitors, filterType, searchQuery]);

  const membersCount = visitors.filter(v => !v.isCurrentAdmin && !v.isAdmin && (v.userTier === 'member' || v.isSocietyMember)).length;
  const normalUsersCount = visitors.filter(v => !v.isCurrentAdmin && !v.isAdmin && v.userTier !== 'member' && !v.isSocietyMember).length;

  const isSelectedAdmin = Boolean(selectedVisitor?.isCurrentAdmin || selectedVisitor?.role === 'admin' || selectedVisitor?.isAdmin);
  const isSelectedMember = Boolean(!isSelectedAdmin && (selectedVisitor?.userTier === 'member' || selectedVisitor?.isSocietyMember));

  return (
    <div className="geo-globe-container">
      {/* 3D WebGL Globe Viewport */}
      <div className="globe-canvas-viewport" ref={containerRef} />

      {/* Top Classification & Live Indicator Banner */}
      <div className="globe-hud-overlay top-left">
        <div className="globe-telemetry-badge">
          <GlobeIcon size={14} className="spin-icon-slow" />
          <span>GOOGLE MAPS EARTH 3D // REAL-TIME GEOLOCATION</span>
        </div>
        <div className="globe-stats-pill">
          <span className="live-radar-dot" />
          <span>{visitors.length} REAL CONNECTED CITIZENS ACROSS THE GLOBE</span>
        </div>
        <div className="ipstack-indicator">
          <span className="ipstack-dot live" />
          <span>IP-API ENHANCED DUAL RESOLUTION</span>
        </div>
      </div>

      {/* Top Right Floating Navigation Tools */}
      <div className="globe-hud-overlay top-right">
        <button
          type="button"
          className={`globe-tool-btn ${autoRotate ? 'active' : ''}`}
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle planetary orbital rotation"
        >
          <Compass size={13} />
          <span>ORBIT: {autoRotate ? 'ACTIVE' : 'PAUSED'}</span>
        </button>

        <button
          type="button"
          className="globe-tool-btn"
          onClick={zoomGlobal}
          title="Reset to global orbital perspective"
        >
          <Layers size={13} />
          <span>GLOBAL VIEW</span>
        </button>

        <button
          type="button"
          className="globe-tool-btn"
          onClick={locateAdmin}
          title="Center on administrator terminal"
        >
          <Shield size={13} color="#f87171" />
          <span>LOCATE ADMIN</span>
        </button>

        <button
          type="button"
          className="globe-tool-btn"
          onClick={fetchVisitors}
          title="Force poll real-time socket connections"
        >
          <Radio size={13} />
          <span>POLL USERS</span>
        </button>
      </div>

      {/* Left Detailed Visitor Telemetry Dossier with Minimize Toggle */}
      {selectedVisitor && !isMinimized ? (
        <div className="globe-visitor-card">
          <div className="visitor-card-header">
            <div className="visitor-card-title">
              <span className="flag-icon">{selectedVisitor.flag || '🌐'}</span>
              <div>
                <div className="visitor-name-row">
                  <h4>@{selectedVisitor.alias}</h4>
                  {isSelectedAdmin ? (
                    <span className="current-admin-tag">👑 ROOT ADMIN</span>
                  ) : isSelectedMember ? (
                    <span className="member-tier-tag">🛡️ SOVEREIGN MEMBER</span>
                  ) : (
                    <span className="user-tier-tag">🌐 VERIFIED CITIZEN</span>
                  )}
                </div>
                <div className="visitor-ip-badge-wrap">
                  <span className="visitor-ip-badge">{selectedVisitor.ip}</span>
                  <button
                    type="button"
                    className="copy-ip-btn"
                    onClick={() => copyToClipboard(selectedVisitor.ip, 'ip')}
                    title="Copy IP Address"
                  >
                    {copiedField === 'ip' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Minimize Button */}
            <div className="visitor-card-controls">
              <button
                type="button"
                className="btn-minimize-dossier"
                onClick={() => setIsMinimized(true)}
                title="Minimize User Dossier to view full Globe"
              >
                <Minus size={14} />
              </button>
            </div>
          </div>

          {/* Online status indicator */}
          <div style={{ padding: '0 1.25rem 0.6rem' }}>
            <span className="status-pill live">
              ONLINE // LIVE WEBSOCKET
            </span>
          </div>

          {/* Member cross-reference if available */}
          {(isSelectedMember || selectedVisitor.locationRelation) && (
            <div className="member-cross-reference-card">
              <div className="mcr-header">
                <ShieldCheck size={13} className="mcr-icon" />
                <span className="mcr-title">COUNCIL INDUCTION CROSS-REFERENCE</span>
                {selectedVisitor.locationRelation?.type === 'match' ? (
                  <span className="relation-status-badge match">✓ VERIFIED REGIONAL MATCH</span>
                ) : (
                  <span className="relation-status-badge discrepancy">⚠️ LOCATION DISCREPANCY</span>
                )}
              </div>
              <div className="mcr-body">
                <div className="mcr-row">
                  <span className="mcr-label">ENTERED DOSSIER LOCATION:</span>
                  <span className="mcr-val declared">
                    <FileText size={11} />
                    {selectedVisitor.declaredLocation || 'Not Stated in Application'}
                  </span>
                </div>
                <div className="mcr-row">
                  <span className="mcr-label">REAL TRANSMISSION TELEMETRY:</span>
                  <span className="mcr-val detected">
                    <MapPin size={11} />
                    {selectedVisitor.city}{selectedVisitor.region ? `, ${selectedVisitor.region}` : ''}, {selectedVisitor.country} ({selectedVisitor.countryCode})
                  </span>
                </div>
                {selectedVisitor.locationRelation?.summary && (
                  <div className="mcr-note">
                    {selectedVisitor.locationRelation.summary}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* In-Depth Telemetry Grid */}
          <div className="visitor-grid-details in-depth">
            <div className="detail-item">
              <span className="detail-label">EXACT LOCATION</span>
              <span className="detail-value highlight">
                {selectedVisitor.city}{selectedVisitor.region ? `, ${selectedVisitor.region}` : ''}, {selectedVisitor.country} ({selectedVisitor.countryCode})
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">COORDINATES &amp; POSTAL</span>
              <div className="detail-coord-row">
                <span className="detail-value cyan">
                  {selectedVisitor.latitude?.toFixed(4)}°N, {selectedVisitor.longitude?.toFixed(4)}°E
                </span>
                {selectedVisitor.zip && <span className="zip-pill">ZIP: {selectedVisitor.zip}</span>}
                <button
                  type="button"
                  className="copy-mini-btn"
                  onClick={() => copyToClipboard(`${selectedVisitor.latitude}, ${selectedVisitor.longitude}`, 'coords')}
                  title="Copy Lat/Lon"
                >
                  {copiedField === 'coords' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                </button>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">ISP &amp; AUTONOMOUS SYSTEM</span>
              <span className="detail-value">
                {selectedVisitor.isp || 'Autonomous Network'} {selectedVisitor.asn ? `• ${selectedVisitor.asn}` : ''}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">TIMEZONE &amp; TELEMETRY</span>
              <div className="timezone-row">
                <Clock size={12} className="time-icon" />
                <span className="detail-value gold">
                  {selectedVisitor.timezone || 'UTC'}
                </span>
                <span className="verified-pill">
                  <CheckCircle2 size={11} color="#10b981" />
                  <span>{selectedVisitor.source || 'IP-API Verified'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* External Map & Satellite Actions */}
          <div className="visitor-actions-footer">
            <a
              href={`https://www.google.com/maps?q=${selectedVisitor.latitude},${selectedVisitor.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="map-action-link"
              title="Open location on Google Maps Satellite"
            >
              <Navigation size={13} />
              <span>Satellite Map</span>
              <ExternalLink size={12} />
            </a>

            <button
              type="button"
              className="btn-focus-globe"
              onClick={() => flyToVisitor(selectedVisitor)}
            >
              <Crosshair size={13} />
              <span>Zoom In on Globe</span>
            </button>
          </div>
        </div>
      ) : selectedVisitor && isMinimized ? (
        <button
          type="button"
          className="globe-minimized-pill"
          onClick={() => setIsMinimized(false)}
          title="Click to expand Citizen Dossier"
        >
          <span className="min-flag">{selectedVisitor.flag || '🌐'}</span>
          <span className="min-alias">@{selectedVisitor.alias}</span>
          <span className="min-action"><Maximize2 size={12} /> Expand Dossier</span>
        </button>
      ) : null}

      {/* Right Drawer: Live Online Visitors Roster */}
      <div className="globe-roster-sidebar">
        <div className="roster-header">
          <div className="roster-title">
            <Users size={14} />
            <span>LIVE CITIZEN ROSTER</span>
          </div>
          <span className="roster-count">{filteredVisitors.length} ONLINE</span>
        </div>

        {/* Filter Tabs */}
        <div className="roster-filter-tabs">
          <button
            type="button"
            className={`filter-tab-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Online ({visitors.length})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${filterType === 'members' ? 'active' : ''}`}
            onClick={() => setFilterType('members')}
          >
            Members ({membersCount})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${filterType === 'users' ? 'active' : ''}`}
            onClick={() => setFilterType('users')}
          >
            Users ({normalUsersCount})
          </button>
        </div>

        <div className="roster-search-bar">
          <Search size={13} />
          <input
            type="text"
            placeholder="Search by Alias, City, Country, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="roster-list">
          {loading && visitors.length === 0 ? (
            <div className="roster-empty">Acquiring global coordinates via IPStack...</div>
          ) : filteredVisitors.length === 0 ? (
            <div className="roster-empty">No live users matching filter</div>
          ) : (
            filteredVisitors.map((v) => {
              const isSelected = selectedVisitor?.id === v.id;
              const isItemAdmin = Boolean(v.isCurrentAdmin || v.role === 'admin' || v.isAdmin);
              const isItemMember = Boolean(!isItemAdmin && (v.userTier === 'member' || v.isSocietyMember));

              return (
                <div
                  key={v.id}
                  className={`roster-node-item ${isSelected ? 'selected' : ''} ${isItemAdmin ? 'current-user-node' : ''} ${isItemMember ? 'member-user-node' : ''}`}
                  onClick={() => flyToVisitor(v)}
                >
                  <span className="node-flag">{v.flag || '🌐'}</span>
                  <div className="node-info">
                    <div className="node-alias-row">
                      <span className="node-alias">@{v.alias}</span>
                      {isItemAdmin ? (
                        <span className="admin-chip">ADMIN</span>
                      ) : isItemMember ? (
                        <span className="member-chip">MEMBER</span>
                      ) : (
                        <span className="user-chip">CITIZEN</span>
                      )}
                    </div>
                    <span className="node-city">
                      {v.city ? `${v.city}, ${v.region || ''} • ${v.countryCode || v.country || 'Global'}` : 'Global Relay Point'}
                    </span>
                    <span className="node-ip-preview">{v.ip}</span>
                  </div>
                  <button
                    type="button"
                    className="node-fly-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      flyToVisitor(v);
                    }}
                    title="Center globe on this citizen"
                  >
                    <Crosshair size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
