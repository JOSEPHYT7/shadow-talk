import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Globe from 'globe.gl';
import * as THREE from 'three';
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
  Maximize2,
  Map as MapIcon,
  Sun,
  EyeOff
} from 'lucide-react';
import { WORLD_CITIES } from './geoCitiesData';
import { STATE_BOUNDARIES } from './geoStatesData';
import './GeoGlobe3D.css';

/**
 * Convert latitude/longitude to 3D cartesian coordinates (NASA spherical standard)
 */
export function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

export default function GeoGlobe3D({ adminToken, serverUrl }) {
  const containerRef = useRef(null);
  const globeInstanceRef = useRef(null);
  const stalkGroupsRef = useRef([]);
  const animFrameIdRef = useRef(null);

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'members' | 'users'
  const [ipstackConfigured, setIpstackConfigured] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [copiedField, setCopiedField] = useState(null);

  // Map Mode: 'tiles' (Google Maps style high-clarity slippy tiles), 'satellite' (NASA Blue Marble), 'cyber' (Dark Vector)
  const [mapMode, setMapMode] = useState('tiles');
  const [showBorders, setShowBorders] = useState(true);
  const [showStates, setShowStates] = useState(true);
  const [showCities, setShowCities] = useState(true);
  const [showArcs, setShowArcs] = useState(true);
  const [countriesData, setCountriesData] = useState([]);

  // Fetch countries GeoJSON vector polygon boundaries
  useEffect(() => {
    fetch('/countries.geojson')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.features)) {
          setCountriesData(data.features);
        }
      })
      .catch((err) => console.warn('[GeoGlobe3D]: Countries GeoJSON not loaded:', err));
  }, []);

  // Fetch real visitors geolocation telemetry
  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${serverUrl}/api/admin/dashboard/geo-visitors`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = (data.visitors || []).filter((v) => !v.isRelay);
        setVisitors(list);
        setIpstackConfigured(Boolean(data.ipstackConfigured));

        if (list.length > 0 && !selectedVisitor) {
          const preferred = list.find((v) => v.isCurrentAdmin) || list[0];
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

  // Initialize Globe.GL with high-resolution engine, vector boundaries, and OrbitControls
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const width = containerRef.current.clientWidth || window.innerWidth - 380;
    const height = containerRef.current.clientHeight || window.innerHeight - 180;

    const globe = Globe({ animateIn: true })(containerRef.current)
      .width(width)
      .height(height)
      .showAtmosphere(true)
      .atmosphereColor('#38bdf8')
      .atmosphereAltitude(0.22);

    // Apply initial base map
    applyMapMode(globe, 'tiles');

    // Configure OrbitControls for Google Maps-style deep zoom down to street/state level
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.minDistance = 101.5; // Deep zoom close to Earth's surface
    controls.maxDistance = 550;   // High orbital perspective
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Initial camera orientation
    globe.pointOfView({ lat: 20, lng: 78, altitude: 2.1 }, 1000);
    globeInstanceRef.current = globe;

    // Continuous render tick for camera backface culling (hiding markers on reverse side of Earth)
    const tickCulling = () => {
      if (globeInstanceRef.current) {
        const cam = globeInstanceRef.current.camera();
        const camDir = cam.position.clone().normalize();

        stalkGroupsRef.current.forEach((grp) => {
          if (!grp) return;
          const worldPos = new THREE.Vector3();
          grp.getWorldPosition(worldPos);
          const dir = worldPos.clone().normalize();
          const dot = dir.dot(camDir);
          // Strict threshold: hide if facing away from camera
          grp.visible = dot > 0.08;
        });
      }
      animFrameIdRef.current = requestAnimationFrame(tickCulling);
    };
    animFrameIdRef.current = requestAnimationFrame(tickCulling);

    const handleResize = () => {
      if (containerRef.current && globeInstanceRef.current) {
        globeInstanceRef.current.width(containerRef.current.clientWidth);
        globeInstanceRef.current.height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (globeInstanceRef.current) {
        globeInstanceRef.current._destructor?.();
        globeInstanceRef.current = null;
      }
    };
  }, []);

  // Apply Map Mode (Google Maps Slippy Tiles, NASA Satellite, or Cyber Vector)
  const applyMapMode = (globe, mode) => {
    if (!globe) return;
    if (mode === 'tiles') {
      // Dynamic Google Maps / CartoDB Voyager Slippy Tile Engine for infinite zoom clarity
      globe
        .globeTileEngineUrl((x, y, l) => `https://basemaps.cartocdn.com/rastertiles/voyager/${l}/${x}/${y}.png`)
        .globeImageUrl(null)
        .bumpImageUrl(null)
        .backgroundImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/night-sky.png')
        .atmosphereColor('#4da6ff');
    } else if (mode === 'satellite') {
      // NASA Blue Marble High-Res Satellite Texture with elevation topology
      globe
        .globeTileEngineUrl(null)
        .globeImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/night-sky.png')
        .atmosphereColor('#38bdf8');
    } else if (mode === 'cyber') {
      // Neon Cyber Grid Mode
      globe
        .globeTileEngineUrl(null)
        .globeImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/earth-dark.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/night-sky.png')
        .atmosphereColor('#00f3ff');
    }
  };

  // Switch map mode
  const handleMapModeChange = (mode) => {
    setMapMode(mode);
    if (globeInstanceRef.current) {
      applyMapMode(globeInstanceRef.current, mode);
    }
  };

  // Generate high-resolution circular canvas texture for the 3D avatar badge
  const createAvatarTexture = useCallback((v, isSelected) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const isAdmin = Boolean(v.isCurrentAdmin || v.role === 'admin' || v.isAdmin);
    const isMember = Boolean(!isAdmin && (v.userTier === 'member' || v.isSocietyMember));
    const ringColor = isAdmin ? '#ef4444' : isMember ? '#ffd700' : '#00f3ff';

    // 1. Outer Glow Circle
    ctx.shadowColor = ringColor;
    ctx.shadowBlur = isSelected ? 24 : 14;
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0f1d';
    ctx.fill();

    // 2. Role Ring Stroke
    ctx.lineWidth = isSelected ? 12 : 8;
    ctx.strokeStyle = ringColor;
    ctx.stroke();

    // 3. Inner Circular Clip for Avatar Photo
    ctx.save();
    ctx.beginPath();
    ctx.arc(128, 128, 96, 0, Math.PI * 2);
    ctx.clip();

    // Fallback Initial Background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);
    ctx.font = 'bold 88px "Inter", sans-serif';
    ctx.fillStyle = ringColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initial = (v.alias || 'U')[0].toUpperCase();
    ctx.fillText(initial, 128, 128);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    // Load actual user avatar image if available
    if (v.avatar) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(128, 128, 96, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 32, 32, 192, 192);
        ctx.restore();

        // Crown / Seal Badge in Top-Right
        if (isAdmin) {
          ctx.font = '36px sans-serif';
          ctx.fillText('👑', 190, 68);
        } else if (isMember) {
          ctx.font = 'bold 36px serif';
          ctx.fillStyle = '#ffd700';
          ctx.fillText('Ω', 190, 68);
        }

        texture.needsUpdate = true;
      };
      img.src = v.avatar;
    }

    return texture;
  }, []);

  // Update 3D User Poles matching the reference image and code
  useEffect(() => {
    if (!globeInstanceRef.current) return;
    const globe = globeInstanceRef.current;

    const validVisitors = visitors.filter(
      (v) => typeof v.latitude === 'number' && typeof v.longitude === 'number' && !isNaN(v.latitude) && !isNaN(v.longitude)
    );

    stalkGroupsRef.current = [];

    // Render 3D Stalk Poles matching the reference image:
    // - Cone pin point at Earth surface
    // - Slender cylinder pin stem to elevated top position
    // - High-res circular avatar badge at the top
    globe
      .customLayerData(validVisitors)
      .customThreeObject((d) => {
        const R = globe.getGlobeRadius(); // 100
        const surfCoords = globe.getCoords(d.latitude, d.longitude, 0.001);
        const topCoords = globe.getCoords(d.latitude, d.longitude, 0.18);

        const surfacePosition = new THREE.Vector3(surfCoords.x, surfCoords.y, surfCoords.z);
        const topPosition = new THREE.Vector3(topCoords.x, topCoords.y, topCoords.z);

        const lineHeight = surfacePosition.distanceTo(topPosition);
        const lineCenter = surfacePosition.clone().lerp(topPosition, 0.5);
        const direction = topPosition.clone().sub(surfacePosition).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

        const isAdmin = Boolean(d.isCurrentAdmin || d.role === 'admin' || d.isAdmin);
        const isMember = Boolean(!isAdmin && (d.userTier === 'member' || d.isSocietyMember));
        const color = isAdmin ? 0xef4444 : isMember ? 0xffd700 : 0x00f3ff;
        const isSelected = selectedVisitor?.id === d.id;

        const group = new THREE.Group();

        // 1. Cone Pin Point at the surface (matching reference image coneGeometry)
        const coneGeom = new THREE.ConeGeometry(0.75, 2.2, 16);
        const coneMat = new THREE.MeshBasicMaterial({ color: isSelected ? 0xf97316 : color });
        const coneMesh = new THREE.Mesh(coneGeom, coneMat);
        coneMesh.position.copy(surfacePosition);
        coneMesh.quaternion.copy(quaternion);
        group.add(coneMesh);

        // 2. Cylinder Pin Stem from surface to elevated top (matching reference cylinderGeometry)
        const stemGeom = new THREE.CylinderGeometry(0.18, 0.18, lineHeight, 16);
        const stemMat = new THREE.MeshBasicMaterial({
          color: isSelected ? 0xffffff : 0x94a3b8,
          transparent: true,
          opacity: isSelected ? 0.95 : 0.65
        });
        const stemMesh = new THREE.Mesh(stemGeom, stemMat);
        stemMesh.position.copy(lineCenter);
        stemMesh.quaternion.copy(quaternion);
        group.add(stemMesh);

        // 3. Circular Avatar Badge at topPosition (3D GPU Sprite facing camera)
        const avatarTex = createAvatarTexture(d, isSelected);
        const spriteMat = new THREE.SpriteMaterial({
          map: avatarTex,
          transparent: true,
          depthTest: false,
          depthWrite: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.copy(topPosition);
        const badgeScale = isSelected ? 16 : 13;
        sprite.scale.set(badgeScale, badgeScale, 1);
        group.add(sprite);

        group.userData = {
          visitor: d,
          sprite,
          stem: stemMesh,
          cone: coneMesh,
          topPosition
        };

        stalkGroupsRef.current.push(group);
        return group;
      })
      .onCustomLayerClick((d) => {
        if (d) flyToVisitor(d);
      })
      .onCustomLayerHover((d) => {
        if (containerRef.current) {
          containerRef.current.style.cursor = d ? 'pointer' : 'grab';
        }
      });

    // 2. Pulsing Radar Sensor Rings on ground coordinates
    globe
      .ringsData(validVisitors)
      .ringLat((d) => d.latitude)
      .ringLng((d) => d.longitude)
      .ringColor((d) => {
        const isAdmin = Boolean(d.isCurrentAdmin || d.role === 'admin' || d.isAdmin);
        const isMember = Boolean(!isAdmin && (d.userTier === 'member' || d.isSocietyMember));
        return isAdmin ? '#ef4444' : isMember ? '#ffd700' : '#00f3ff';
      })
      .ringMaxRadius(4.2)
      .ringPropagationSpeed(1.4)
      .ringRepeatPeriod(1200);

    // 3. Central Command Relay Arcs
    if (showArcs) {
      const adminNode = validVisitors.find((v) => v.isCurrentAdmin);
      if (adminNode) {
        const arcLinks = validVisitors
          .filter((v) => v.id !== adminNode.id)
          .map((v) => {
            const isMember = Boolean(v.userTier === 'member' || v.isSocietyMember);
            return {
              startLat: adminNode.latitude,
              startLng: adminNode.longitude,
              endLat: v.latitude,
              endLng: v.longitude,
              color: isMember
                ? ['rgba(239, 68, 68, 0.85)', 'rgba(255, 215, 0, 0.85)']
                : ['rgba(239, 68, 68, 0.85)', 'rgba(0, 243, 255, 0.85)']
            };
          });

        globe
          .arcsData(arcLinks)
          .arcStartLat((d) => d.startLat)
          .arcStartLng((d) => d.startLng)
          .arcEndLat((d) => d.endLat)
          .arcEndLng((d) => d.endLng)
          .arcColor((d) => d.color)
          .arcDashLength(0.4)
          .arcDashGap(0.2)
          .arcDashAnimateTime(2000)
          .arcAltitudeAutoScale(0.28);
      } else {
        globe.arcsData([]);
      }
    } else {
      globe.arcsData([]);
    }
  }, [visitors, selectedVisitor, showArcs, createAvatarTexture]);

  // Update Country Boundaries Layer (Natural Earth GeoJSON)
  useEffect(() => {
    if (!globeInstanceRef.current) return;
    const globe = globeInstanceRef.current;

    if (showBorders && countriesData.length > 0) {
      globe
        .polygonsData(countriesData)
        .polygonCapColor(() => 'rgba(2, 6, 23, 0.0)') // Transparent inside to allow satellite/tiles to shine through
        .polygonSideColor(() => 'rgba(0, 0, 0, 0.04)')
        .polygonStrokeColor(() => 'rgba(56, 189, 248, 0.8)') // Glowing cyan vector borders
        .polygonAltitude(0.005)
        .polygonLabel(({ properties: d }) => `
          <div class="globe-country-tooltip">
            <strong>${d.ADMIN || d.NAME}</strong>
            <span>${d.REGION_UN || d.CONTINENT || ''} &bull; ISO: ${d.ISO_A2 || d.ISO_A3}</span>
          </div>
        `);
    } else {
      globe.polygonsData([]);
    }
  }, [showBorders, countriesData]);

  // Update State & Provincial Boundaries Layer
  useEffect(() => {
    if (!globeInstanceRef.current) return;
    const globe = globeInstanceRef.current;

    if (showStates) {
      globe
        .pathsData(STATE_BOUNDARIES)
        .pathPoints((d) => d.coords)
        .pathColor(() => 'rgba(148, 163, 184, 0.75)') // Crisp slate state border line
        .pathDashLength(0.02)
        .pathDashGap(0.01)
        .pathAltitude(0.007)
        .pathLabel((d) => `
          <div class="globe-state-tooltip">
            <strong>${d.name}</strong>
            <span>${d.country}</span>
          </div>
        `);
    } else {
      globe.pathsData([]);
    }
  }, [showStates]);

  // Update World Cities & Regional Labels Layer
  useEffect(() => {
    if (!globeInstanceRef.current) return;
    const globe = globeInstanceRef.current;

    if (showCities) {
      globe
        .labelsData(WORLD_CITIES)
        .labelLat((d) => d.lat)
        .labelLng((d) => d.lng)
        .labelText((d) => d.name)
        .labelSize((d) => (d.isCapital || d.isMegacity ? 0.75 : 0.52))
        .labelDotRadius((d) => (d.isCapital ? 0.38 : 0.25))
        .labelColor((d) => (d.isCapital ? '#38bdf8' : '#e2e8f0'))
        .labelAltitude(0.009)
        .labelResolution(2)
        .labelLabel((d) => `
          <div class="globe-city-tooltip">
            <strong>${d.name}</strong>
            <span>${d.state ? d.state + ', ' : ''}${d.country} &bull; ${d.isCapital ? 'Capital' : 'Major Center'}</span>
          </div>
        `);
    } else {
      globe.labelsData([]);
    }
  }, [showCities]);

  // Auto-rotate toggle
  useEffect(() => {
    if (globeInstanceRef.current) {
      globeInstanceRef.current.controls().autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Smooth Google Earth camera fly to citizen coordinates
  const flyToVisitor = (v) => {
    setSelectedVisitor(v);
    setIsMinimized(false);
    if (globeInstanceRef.current && typeof v.latitude === 'number' && typeof v.longitude === 'number') {
      globeInstanceRef.current.controls().autoRotate = false;
      setAutoRotate(false);
      // Zoom close to coordinates for regional street/city clarity
      globeInstanceRef.current.pointOfView(
        {
          lat: v.latitude,
          lng: v.longitude,
          altitude: 0.28
        },
        1400
      );
    }
  };

  // Zoom back out to global view
  const zoomGlobal = () => {
    if (globeInstanceRef.current) {
      globeInstanceRef.current.controls().autoRotate = true;
      setAutoRotate(true);
      globeInstanceRef.current.pointOfView(
        {
          lat: 20,
          lng: 78,
          altitude: 2.1
        },
        1200
      );
    }
  };

  // Zoom in one step
  const handleZoomIn = () => {
    if (globeInstanceRef.current) {
      const pov = globeInstanceRef.current.pointOfView();
      globeInstanceRef.current.pointOfView(
        {
          altitude: Math.max(0.08, pov.altitude * 0.65)
        },
        400
      );
    }
  };

  // Zoom out one step
  const handleZoomOut = () => {
    if (globeInstanceRef.current) {
      const pov = globeInstanceRef.current.pointOfView();
      globeInstanceRef.current.pointOfView(
        {
          altitude: Math.min(4.5, pov.altitude * 1.5)
        },
        400
      );
    }
  };

  // Center on root administrator
  const locateAdmin = () => {
    const adminNode = visitors.find((v) => v.isCurrentAdmin);
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

  const membersCount = visitors.filter(
    (v) => !v.isCurrentAdmin && !v.isAdmin && (v.userTier === 'member' || v.isSocietyMember)
  ).length;
  const normalUsersCount = visitors.filter(
    (v) => !v.isCurrentAdmin && !v.isAdmin && v.userTier !== 'member' && !v.isSocietyMember
  ).length;

  const isSelectedAdmin = Boolean(
    selectedVisitor?.isCurrentAdmin || selectedVisitor?.role === 'admin' || selectedVisitor?.isAdmin
  );
  const isSelectedMember = Boolean(
    !isSelectedAdmin && (selectedVisitor?.userTier === 'member' || selectedVisitor?.isSocietyMember)
  );

  return (
    <div className="geo-globe-container">
      {/* 3D WebGL Globe Viewport */}
      <div className="globe-canvas-viewport" ref={containerRef} />

      {/* Top Left Classification & Telemetry Banner */}
      <div className="globe-hud-overlay top-left">
        <div className="globe-telemetry-badge">
          <GlobeIcon size={14} className="spin-icon-slow" />
          <span>GOOGLE MAPS 3D TELEMETRY // GLOBAL CITIZEN POLES</span>
        </div>
        <div className="globe-stats-pill">
          <span className="live-radar-dot" />
          <span>{visitors.length} CONNECTED CITIZENS WITH REAL 3D STALKS</span>
        </div>

        {/* Map Engine Mode Selector */}
        <div className="globe-mode-switch-cluster">
          <button
            type="button"
            className={`globe-toggle-btn ${mapMode === 'tiles' ? 'active' : ''}`}
            onClick={() => handleMapModeChange('tiles')}
            title="Google Maps / CartoDB Slippy Tiles (maximum zoom clarity for streets, cities, borders)"
          >
            <MapIcon size={12} />
            <span>MAP TILES (DEEP ZOOM)</span>
          </button>
          <button
            type="button"
            className={`globe-toggle-btn ${mapMode === 'satellite' ? 'active' : ''}`}
            onClick={() => handleMapModeChange('satellite')}
            title="NASA Blue Marble Satellite & Atmosphere"
          >
            <Sun size={12} />
            <span>SATELLITE</span>
          </button>
          <button
            type="button"
            className={`globe-toggle-btn ${mapMode === 'cyber' ? 'active' : ''}`}
            onClick={() => handleMapModeChange('cyber')}
            title="Dark Cyber Vector Network"
          >
            <Zap size={12} />
            <span>CYBER</span>
          </button>
        </div>

        {/* Vector Layers Visibility Toggles */}
        <div className="globe-layers-strip">
          <button
            type="button"
            className={`globe-chip-toggle ${showBorders ? 'active' : ''}`}
            onClick={() => setShowBorders(!showBorders)}
            title="Toggle Country Vector Boundaries"
          >
            Borders: {showBorders ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            className={`globe-chip-toggle ${showStates ? 'active' : ''}`}
            onClick={() => setShowStates(!showStates)}
            title="Toggle State & Provincial Boundaries"
          >
            States: {showStates ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            className={`globe-chip-toggle ${showCities ? 'active' : ''}`}
            onClick={() => setShowCities(!showCities)}
            title="Toggle World Cities & Regional Labels"
          >
            Cities: {showCities ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            className={`globe-chip-toggle ${showArcs ? 'active' : ''}`}
            onClick={() => setShowArcs(!showArcs)}
            title="Toggle Central Relay Arcs"
          >
            Relays: {showArcs ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Top Right Floating Navigation & Zoom Tools */}
      <div className="globe-hud-overlay top-right">
        <button
          type="button"
          className="globe-tool-btn"
          onClick={handleZoomIn}
          title="Zoom In (Inspect state and city clarity)"
        >
          <ZoomIn size={13} />
          <span>ZOOM +</span>
        </button>

        <button
          type="button"
          className="globe-tool-btn"
          onClick={handleZoomOut}
          title="Zoom Out (Return to orbital altitude)"
        >
          <ZoomOut size={13} />
          <span>ZOOM -</span>
        </button>

        <button
          type="button"
          className={`globe-tool-btn ${autoRotate ? 'active' : ''}`}
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle planetary orbital rotation"
        >
          <Compass size={13} />
          <span>ORBIT: {autoRotate ? 'ON' : 'PAUSED'}</span>
        </button>

        <button
          type="button"
          className="globe-tool-btn"
          onClick={zoomGlobal}
          title="Reset to global orbital perspective"
        >
          <Layers size={13} />
          <span>RESET VIEW</span>
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
            <span className="status-pill live">ONLINE // LIVE 3D POLE TELEMETRY</span>
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
                    {selectedVisitor.city}
                    {selectedVisitor.region ? `, ${selectedVisitor.region}` : ''}, {selectedVisitor.country} (
                    {selectedVisitor.countryCode})
                  </span>
                </div>
                {selectedVisitor.locationRelation?.summary && (
                  <div className="mcr-note">{selectedVisitor.locationRelation.summary}</div>
                )}
              </div>
            </div>
          )}

          {/* In-Depth Telemetry Grid */}
          <div className="visitor-grid-details in-depth">
            <div className="detail-item">
              <span className="detail-label">EXACT LOCATION</span>
              <span className="detail-value highlight">
                {selectedVisitor.city}
                {selectedVisitor.region ? `, ${selectedVisitor.region}` : ''}, {selectedVisitor.country} (
                {selectedVisitor.countryCode})
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
                  className="coord-action-btn"
                  onClick={() =>
                    copyToClipboard(
                      `${selectedVisitor.latitude}, ${selectedVisitor.longitude}`,
                      'coord'
                    )
                  }
                  title="Copy exact Latitude & Longitude"
                >
                  {copiedField === 'coord' ? (
                    <Check size={11} color="#10b981" />
                  ) : (
                    <Copy size={11} />
                  )}
                </button>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">NETWORK PROVIDER (ISP &amp; ASN)</span>
              <span className="detail-value mono">
                {selectedVisitor.isp || 'Encrypted Provider'}
                {selectedVisitor.asn ? ` (${selectedVisitor.asn})` : ''}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">TIMEZONE &amp; LOCAL TIME</span>
              <span className="detail-value">
                <Clock size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                {selectedVisitor.timezone || 'UTC'} &bull;{' '}
                {selectedVisitor.localTime || new Date().toLocaleTimeString()}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">IP TELEMETRY SOURCE</span>
              <span className="detail-value">
                {selectedVisitor.geoSource === 'ipstack' ? (
                  <span className="source-tag ipstack">IPSTACK REAL-TIME API</span>
                ) : (
                  <span className="source-tag ipapi">IP-API RESILIENT ENGINE</span>
                )}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">ESTIMATED NETWORK LATENCY</span>
              <span className="detail-value green">
                <Activity size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                {selectedVisitor.pingMs ? `${selectedVisitor.pingMs}ms` : '32ms (WebSocket)'}
              </span>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="visitor-card-actions">
            <button
              type="button"
              className="visitor-action-btn fly"
              onClick={() => flyToVisitor(selectedVisitor)}
              title="Fly camera to this citizen pole"
            >
              <Crosshair size={13} />
              <span>FLY TO COORDINATES</span>
            </button>
            <a
              href={`https://www.google.com/maps?q=${selectedVisitor.latitude},${selectedVisitor.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="visitor-action-btn maps"
              title="Open location in Google Maps satellite"
            >
              <ExternalLink size={13} />
              <span>GOOGLE MAPS</span>
            </a>
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
          <span className="min-action">
            <Maximize2 size={12} />
            <span>EXPAND DOSSIER</span>
          </span>
        </button>
      ) : null}

      {/* Right Citizens Telemetry Roster Sidebar */}
      <div className="globe-roster-sidebar">
        <div className="roster-header">
          <div className="roster-title-row">
            <Users size={14} color="#00f3ff" />
            <h3>CITIZEN ROSTER ({filteredVisitors.length})</h3>
          </div>

          {/* Search Box */}
          <div className="roster-search-box">
            <Search size={13} className="roster-search-icon" />
            <input
              type="text"
              placeholder="Search citizens, cities, IPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Tabs */}
          <div className="roster-filter-tabs">
            <button
              type="button"
              className={`roster-tab-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({visitors.length})
            </button>
            <button
              type="button"
              className={`roster-tab-btn ${filterType === 'members' ? 'active' : ''}`}
              onClick={() => setFilterType('members')}
            >
              Members ({membersCount})
            </button>
            <button
              type="button"
              className={`roster-tab-btn ${filterType === 'users' ? 'active' : ''}`}
              onClick={() => setFilterType('users')}
            >
              Users ({normalUsersCount})
            </button>
          </div>
        </div>

        {/* Visitors Scrollable List */}
        <div className="roster-list-scroll">
          {filteredVisitors.length === 0 ? (
            <div className="roster-empty-state">
              <Radio size={24} />
              <p>No citizens matching search criteria</p>
            </div>
          ) : (
            filteredVisitors.map((v) => {
              const isSelected = selectedVisitor?.id === v.id;
              const isAdmin = Boolean(v.isCurrentAdmin || v.role === 'admin' || v.isAdmin);
              const isMember = Boolean(!isAdmin && (v.userTier === 'member' || v.isSocietyMember));

              return (
                <div
                  key={v.id}
                  className={`roster-item ${isSelected ? 'selected' : ''} ${
                    isAdmin ? 'admin-node' : isMember ? 'member-node' : ''
                  }`}
                  onClick={() => flyToVisitor(v)}
                >
                  <div className="roster-item-top">
                    <div className="roster-item-user">
                      <span className="roster-flag">{v.flag || '🌐'}</span>
                      <strong className="roster-alias">@{v.alias}</strong>
                    </div>

                    <div className="roster-item-badges">
                      {isAdmin ? (
                        <span className="roster-badge admin" title="Root Administrator">
                          👑 ADMIN
                        </span>
                      ) : isMember ? (
                        <span className="roster-badge member" title="Secret Society Sovereign">
                          Ω MEMBER
                        </span>
                      ) : (
                        <span className="roster-badge citizen">CITIZEN</span>
                      )}
                    </div>
                  </div>

                  <div className="roster-item-location">
                    <MapPin size={11} className="pin-icon" />
                    <span>
                      {v.city ? `${v.city}, ` : ''}
                      {v.country || 'Unknown Region'}
                    </span>
                  </div>

                  <div className="roster-item-footer">
                    <span className="roster-ip">{v.ip}</span>
                    <span className="roster-coords">
                      {v.latitude?.toFixed(2)}°, {v.longitude?.toFixed(2)}°
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
