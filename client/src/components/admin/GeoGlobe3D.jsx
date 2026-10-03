import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Globe from 'globe.gl';
import * as THREE from 'three';
import {
  Globe as GlobeIcon,
  Radio,
  Search,
  Crosshair,
  Shield,
  Layers,
  MapPin,
  Users,
  Copy,
  Check,
  Compass,
  Zap,
  Minus,
  Maximize2,
  Map as MapIcon,
  Sun,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  FileText,
  ExternalLink,
  Wifi,
  Clock,
  Activity
} from 'lucide-react';
import './GeoGlobe3D.css';

export default function GeoGlobe3D({ adminToken, serverUrl }) {
  const containerRef = useRef(null);
  const globeInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const animFrameIdRef = useRef(null);

  const [globeReady, setGlobeReady] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'members' | 'users'
  const [ipstackConfigured, setIpstackConfigured] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Map Mode: 'tiles' (Voyager Google Maps Deep Zoom), 'osm' (OpenStreetMap with every village), 'cyber' (Dark Matter), 'satellite' (NASA Blue Marble)
  const [mapMode, setMapMode] = useState('tiles');
  const [showBorders, setShowBorders] = useState(true);
  const [showArcs, setShowArcs] = useState(true);
  const [countriesData, setCountriesData] = useState([]);

  // Live ticking clock for dossier timezones
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Apply map mode tile engine or satellite textures
  const applyMapMode = useCallback((globe, mode) => {
    if (!globe) return;
    if (mode === 'tiles') {
      // CartoDB Voyager: Google Maps-style deep zoom streaming all countries, states, cities, towns, and villages worldwide
      globe
        .globeTileEngineUrl((x, y, l) => `https://basemaps.cartocdn.com/rastertiles/voyager/${l}/${x}/${y}.png`)
        .globeTileEngineMaxLevel(18)
        .globeImageUrl(null)
        .bumpImageUrl(null)
        .backgroundImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/night-sky.png')
        .atmosphereColor('#38bdf8');
    } else if (mode === 'osm') {
      // Standard OpenStreetMap tiles containing every single village, town, and hamlet in every country on Earth
      globe
        .globeTileEngineUrl((x, y, l) => `https://tile.openstreetmap.org/${l}/${x}/${y}.png`)
        .globeTileEngineMaxLevel(18)
        .globeImageUrl(null)
        .bumpImageUrl(null)
        .backgroundImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/night-sky.png')
        .atmosphereColor('#38bdf8');
    } else if (mode === 'cyber') {
      // Dark Matter Cyber Network
      globe
        .globeTileEngineUrl((x, y, l) => `https://basemaps.cartocdn.com/dark_all/${l}/${x}/${y}.png`)
        .globeTileEngineMaxLevel(18)
        .globeImageUrl(null)
        .bumpImageUrl(null)
        .backgroundImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/night-sky.png')
        .atmosphereColor('#00f3ff');
    } else if (mode === 'satellite') {
      // High-resolution NASA Blue Marble
      globe
        .globeTileEngineUrl(null)
        .globeImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe@2.45.0/example/img/night-sky.png')
        .atmosphereColor('#38bdf8');
    }

    if (typeof globe.updatePov === 'function') {
      globe.updatePov(globe.camera());
    }
  }, []);

  // Generate high-resolution circular canvas texture for the 3D avatar badge
  const createAvatarTexture = useCallback((v, isSelected) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const isAdmin = Boolean(v.isCurrentAdmin || v.role === 'admin' || v.isAdmin);
    const isMember = Boolean(!isAdmin && (v.userTier === 'member' || v.isSocietyMember));
    const strokeColor = isSelected ? '#f97316' : isAdmin ? '#ef4444' : isMember ? '#ffd700' : '#00f3ff';

    // 1. Outer Circular Glow and Disc
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = isSelected ? 24 : 14;
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.fillStyle = '#060d1b';
    ctx.fill();

    // 2. Role Ring Stroke
    ctx.lineWidth = isSelected ? 12 : 8;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();

    // 3. Inner Circular Clip for Avatar Photo
    ctx.save();
    ctx.beginPath();
    ctx.arc(128, 128, 96, 0, Math.PI * 2);
    ctx.clip();

    // Fallback Initial Monogram
    ctx.fillStyle = '#111e33';
    ctx.fillRect(0, 0, 256, 256);
    ctx.font = 'bold 96px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initial = (v.alias || 'U').replace('@', '')[0]?.toUpperCase() || 'U';
    ctx.fillText(initial, 128, 132);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
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
          ctx.font = '40px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('👑', 190, 68);
        } else if (isMember) {
          ctx.font = 'bold 36px serif';
          ctx.fillStyle = '#ffd700';
          ctx.fillText('Ω', 190, 68);
        }

        texture.needsUpdate = true;
      };
      img.src = v.avatar;
    } else {
      // If no image, draw badges directly
      if (isAdmin) {
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👑', 190, 68);
      } else if (isMember) {
        ctx.font = 'bold 36px serif';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('Ω', 190, 68);
      }
      texture.needsUpdate = true;
    }

    return texture;
  }, []);

  // Rebuild 3D Stalk Markers
  const rebuildMarkers = useCallback(() => {
    if (!globeInstanceRef.current || !markersGroupRef.current) return;
    const globe = globeInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    // Clear previous markers
    while (markersGroup.children.length > 0) {
      const child = markersGroup.children[0];
      markersGroup.remove(child);
      child.traverse?.((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    const validVisitors = visitors.filter(
      (v) => typeof v.latitude === 'number' && typeof v.longitude === 'number' && !isNaN(v.latitude) && !isNaN(v.longitude)
    );

    // Group valid visitors into spatial clusters (within 0.25 deg)
    const clusters = [];
    validVisitors.forEach((v) => {
      const match = clusters.find(
        (c) => Math.hypot(c.lat - v.latitude, c.lng - v.longitude) < 0.25
      );
      if (match) {
        match.visitors.push(v);
      } else {
        clusters.push({
          lat: v.latitude,
          lng: v.longitude,
          visitors: [v]
        });
      }
    });

    // Build 3D Stalks matching reference GIF & Spiderfy Fan-out for Coincident/Same-City Users:
    // - If single user: slender radial 3D cylinder stem + ground cone pin + avatar badge
    // - If multiple users at same location: branch outward in a radial fan/spiderfy cluster
    //   so ALL avatars are distinctly visible, unobstructed, and independently selectable!
    clusters.forEach((cluster) => {
      const count = cluster.visitors.length;
      const surfCoords = globe.getCoords(cluster.lat, cluster.lng, 0.001);
      const surfacePosition = new THREE.Vector3(surfCoords.x, surfCoords.y, surfCoords.z);
      const normal = surfacePosition.clone().normalize();

      // Tangent coordinate system on Earth's surface for spreading coincident markers
      const up = Math.abs(normal.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const tangentX = new THREE.Vector3().crossVectors(normal, up).normalize();
      const tangentY = new THREE.Vector3().crossVectors(normal, tangentX).normalize();

      const hasAdmin = cluster.visitors.some((v) => v.isCurrentAdmin || v.role === 'admin' || v.isAdmin);
      const hasMember = cluster.visitors.some((v) => v.userTier === 'member' || v.isSocietyMember);
      const clusterColor = hasAdmin ? 0xef4444 : hasMember ? 0xffd700 : 0x00f3ff;

      // Base altitude in space
      const centralTop = surfacePosition.clone().add(normal.clone().multiplyScalar(18));

      // Ground beacon ring if cluster has multiple citizens
      if (count > 1) {
        const anchorGeom = new THREE.RingGeometry(0.8, 2.5, 32);
        const anchorMat = new THREE.MeshBasicMaterial({
          color: clusterColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        });
        const anchorMesh = new THREE.Mesh(anchorGeom, anchorMat);
        anchorMesh.position.copy(surfacePosition.clone().add(normal.clone().multiplyScalar(0.08)));
        anchorMesh.lookAt(surfacePosition.clone().add(normal));
        markersGroup.add(anchorMesh);
      }

      cluster.visitors.forEach((d, idx) => {
        let topPosition;
        let groundOrigin = surfacePosition.clone();

        if (count === 1) {
          topPosition = centralTop.clone();
        } else {
          // Spread radius in tangent plane: comfortable distance so badges (width ~14-18) never overlap
          const spreadRadius = 15 + (count - 2) * 2.0;
          // Offset angle starting at PI/4 so fan branches out dynamically
          const angle = (2 * Math.PI * idx) / count + Math.PI / 4;

          const offsetVec = tangentX.clone().multiplyScalar(Math.cos(angle) * spreadRadius)
            .add(tangentY.clone().multiplyScalar(Math.sin(angle) * spreadRadius));

          // Elevate slightly so outer stalks arch gracefully
          topPosition = centralTop.clone().add(offsetVec).add(normal.clone().multiplyScalar(1.5));

          // Slight base displacement for separate stalks at ground if count > 1
          const baseSpread = 0.55;
          const baseOffset = tangentX.clone().multiplyScalar(Math.cos(angle) * baseSpread)
            .add(tangentY.clone().multiplyScalar(Math.sin(angle) * baseSpread));
          groundOrigin.add(baseOffset);
        }

        const lineHeight = groundOrigin.distanceTo(topPosition);
        const lineCenter = groundOrigin.clone().lerp(topPosition, 0.5);
        const direction = topPosition.clone().sub(groundOrigin).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

        const isAdmin = Boolean(d.isCurrentAdmin || d.role === 'admin' || d.isAdmin);
        const isMember = Boolean(!isAdmin && (d.userTier === 'member' || d.isSocietyMember));
        const color = isAdmin ? 0xef4444 : isMember ? 0xffd700 : 0x00f3ff;
        const isSelected = selectedVisitor?.id === d.id;

        const group = new THREE.Group();

        // 1. Cone Pin Point at the surface (inverted so tip touches surface, matching reference)
        const coneGeom = new THREE.ConeGeometry(1.2, 3.6, 16);
        coneGeom.rotateX(Math.PI); // Tip points towards ground
        const coneMat = new THREE.MeshBasicMaterial({ color: isSelected ? 0xf97316 : color });
        const coneMesh = new THREE.Mesh(coneGeom, coneMat);
        coneMesh.position.copy(groundOrigin.clone().add(direction.clone().multiplyScalar(1.8)));
        coneMesh.quaternion.copy(quaternion);
        coneMesh.userData = { visitor: d };
        group.add(coneMesh);

        // 2. Cylinder Pin Stem from surface to elevated top
        const stemGeom = new THREE.CylinderGeometry(0.24, 0.24, lineHeight, 16);
        const stemMat = new THREE.MeshBasicMaterial({
          color: isSelected ? 0xffffff : (isAdmin ? 0xfca5a5 : isMember ? 0xfef08a : 0x94a3b8),
          transparent: true,
          opacity: isSelected ? 0.95 : 0.8
        });
        const stemMesh = new THREE.Mesh(stemGeom, stemMat);
        stemMesh.position.copy(lineCenter);
        stemMesh.quaternion.copy(quaternion);
        stemMesh.userData = { visitor: d };
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
        const badgeScale = isSelected ? 18 : 14;
        sprite.scale.set(badgeScale, badgeScale, 1);
        sprite.userData = { visitor: d };
        group.add(sprite);

        group.userData = {
          visitor: d,
          sprite,
          stem: stemMesh,
          cone: coneMesh,
          topPos: topPosition,
          surfacePos: groundOrigin
        };

        markersGroup.add(group);
      });
    });

    // 2. Pulsing Radar Sensor Rings on ground coordinates (unique locations)
    const uniqueRingLocations = clusters.map((c) => {
      const hasAdmin = c.visitors.some((v) => v.isCurrentAdmin || v.role === 'admin' || v.isAdmin);
      const hasMember = c.visitors.some((v) => v.userTier === 'member' || v.isSocietyMember);
      return {
        latitude: c.lat,
        longitude: c.lng,
        color: hasAdmin ? '#ef4444' : hasMember ? '#ffd700' : '#00f3ff',
        maxRadius: c.visitors.length > 1 ? 5.5 : 4.5
      };
    });

    globe
      .ringsData(uniqueRingLocations)
      .ringLat((d) => d.latitude)
      .ringLng((d) => d.longitude)
      .ringColor((d) => d.color)
      .ringMaxRadius((d) => d.maxRadius)
      .ringPropagationSpeed(1.5)
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

  // Initialize Globe.GL
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
      .atmosphereAltitude(0.2);

    // Apply default Deep Zoom Slippy Tiles
    applyMapMode(globe, 'tiles');

    // Controls
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.minDistance = 101.5; // Deep zoom close to Earth's surface for street/village clarity
    controls.maxDistance = 550;   // Orbital view
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Initial camera POV
    globe.pointOfView({ lat: 20, lng: 78, altitude: 2.1 }, 1000);
    globeInstanceRef.current = globe;

    // Dedicated Three.js Group for 3D Citizen Stalk Markers added directly to Globe Scene
    const markersGroup = new THREE.Group();
    markersGroup.name = 'citizen-stalk-markers-group';
    globe.scene().add(markersGroup);
    markersGroupRef.current = markersGroup;
    setGlobeReady(true);

    // Continuous render tick:
    // 1. Camera backface culling (hiding markers on reverse side of Earth, matching reference)
    // 2. Trigger tile engine update to dynamically stream deep zoom tiles
    const tick = () => {
      if (globeInstanceRef.current) {
        const cam = globeInstanceRef.current.camera();
        const camDir = cam.position.clone().normalize();

        // Cull markers on reverse side of Earth
        if (markersGroupRef.current) {
          markersGroupRef.current.children.forEach((grp) => {
            if (!grp.userData || !grp.userData.topPos) return;
            const markerDir = grp.userData.topPos.clone().normalize();
            const dot = markerDir.dot(camDir);
            grp.visible = dot > 0.05;
          });
        }

        // Trigger dynamic tile update for slippy map
        if (typeof globeInstanceRef.current.updatePov === 'function') {
          globeInstanceRef.current.updatePov(cam);
        }
        globeInstanceRef.current.scene().traverse((child) => {
          if (child && typeof child.updatePov === 'function') {
            child.updatePov(cam);
          }
        });
      }
      animFrameIdRef.current = requestAnimationFrame(tick);
    };
    animFrameIdRef.current = requestAnimationFrame(tick);

    // Interactive Raycaster for clicking markers in 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event) => {
      if (!containerRef.current || !globeInstanceRef.current || !markersGroupRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, globeInstanceRef.current.camera());
      const visibleGroups = markersGroupRef.current.children.filter((g) => g.visible);
      const intersects = raycaster.intersectObjects(visibleGroups, true);

      if (intersects.length > 0) {
        let curr = intersects[0].object;
        while (curr && !curr.userData?.visitor && curr.parent) {
          curr = curr.parent;
        }
        if (curr?.userData?.visitor) {
          flyToVisitor(curr.userData.visitor);
        }
      }
    };

    const handlePointerMove = (event) => {
      if (!containerRef.current || !globeInstanceRef.current || !markersGroupRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, globeInstanceRef.current.camera());
      const visibleGroups = markersGroupRef.current.children.filter((g) => g.visible);
      const intersects = raycaster.intersectObjects(visibleGroups, true);

      containerRef.current.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
    };

    const dom = containerRef.current;
    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('pointermove', handlePointerMove);

    const handleResize = () => {
      if (containerRef.current && globeInstanceRef.current) {
        globeInstanceRef.current.width(containerRef.current.clientWidth);
        globeInstanceRef.current.height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (globeInstanceRef.current) {
        globeInstanceRef.current._destructor?.();
        globeInstanceRef.current = null;
      }
    };
  }, [applyMapMode]);

  // Re-run markers whenever globeReady or dependencies change
  useEffect(() => {
    if (globeReady) {
      rebuildMarkers();
    }
  }, [globeReady, rebuildMarkers]);

  // Handle map mode button click
  const handleMapModeChange = (mode) => {
    setMapMode(mode);
    if (globeInstanceRef.current) {
      applyMapMode(globeInstanceRef.current, mode);
    }
  };

  // Update Country Boundaries Vector Layer (Natural Earth GeoJSON)
  useEffect(() => {
    if (!globeInstanceRef.current) return;
    const globe = globeInstanceRef.current;

    if (showBorders && countriesData.length > 0) {
      globe
        .polygonsData(countriesData)
        .polygonCapColor(() => 'rgba(2, 6, 23, 0.0)') // Transparent inside so tile map shines through
        .polygonSideColor(() => 'rgba(0, 0, 0, 0.04)')
        .polygonStrokeColor(() => 'rgba(56, 189, 248, 0.75)') // Glowing cyan borders
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
  }, [showBorders, countriesData, globeReady]);

  // Auto-rotate toggle
  useEffect(() => {
    if (globeInstanceRef.current) {
      globeInstanceRef.current.controls().autoRotate = autoRotate;
    }
  }, [autoRotate, globeReady]);

  // Smooth Google Earth camera fly to citizen coordinates
  const flyToVisitor = (v) => {
    setSelectedVisitor(v);
    setIsMinimized(false);
    if (globeInstanceRef.current && typeof v.latitude === 'number' && typeof v.longitude === 'number') {
      globeInstanceRef.current.controls().autoRotate = false;
      setAutoRotate(false);
      // Zoom close to coordinates for regional street/city/village clarity
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

  // Formatted Visitor Local Time
  const visitorLocalTime = useMemo(() => {
    if (!selectedVisitor?.timezone) return null;
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: selectedVisitor.timezone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      }).format(new Date(currentTime));
    } catch {
      return new Date(currentTime).toLocaleTimeString();
    }
  }, [selectedVisitor, currentTime]);

  return (
    <div className="geo-globe-container">
      {/* 3D WebGL Globe Viewport */}
      <div className="globe-canvas-viewport" ref={containerRef} />

      {/* Top Unified HUD Bar - Guaranteed No Overlap */}
      <div className="globe-top-hud">
        {/* Left Stack: Branding, Live Radar Pill, Map Mode Switches & Vector Toggles */}
        <div className="hud-left-stack">
          <div className="hud-brand-row">
            <div className="globe-telemetry-badge">
              <GlobeIcon size={14} className="spin-icon-slow" />
              <span>GOOGLE MAPS 3D TELEMETRY // GLOBAL CITIZEN POLES</span>
            </div>
            <div className="globe-stats-pill">
              <span className="live-radar-dot" />
              <span>{visitors.length} CONNECTED CITIZENS WITH REAL 3D STALKS</span>
            </div>
          </div>

          {/* Map Engine Mode Selector */}
          <div className="globe-mode-switch-cluster">
            <button
              type="button"
              className={`globe-toggle-btn ${mapMode === 'tiles' ? 'active' : ''}`}
              onClick={() => handleMapModeChange('tiles')}
              title="Google Maps / CartoDB Voyager Slippy Tiles (maximum zoom clarity for all countries, states, cities, towns, and villages)"
            >
              <MapIcon size={12} />
              <span>MAP (DEEP ZOOM)</span>
            </button>
            <button
              type="button"
              className={`globe-toggle-btn ${mapMode === 'osm' ? 'active' : ''}`}
              onClick={() => handleMapModeChange('osm')}
              title="OpenStreetMap Standard: Render every village, hamlet, town, and street worldwide"
            >
              <Layers size={12} />
              <span>OPENSTREETMAP</span>
            </button>
            <button
              type="button"
              className={`globe-toggle-btn ${mapMode === 'cyber' ? 'active' : ''}`}
              onClick={() => handleMapModeChange('cyber')}
              title="Dark Cyber Vector Network"
            >
              <Zap size={12} />
              <span>CYBER DARK</span>
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
              className={`globe-chip-toggle ${showArcs ? 'active' : ''}`}
              onClick={() => setShowArcs(!showArcs)}
              title="Toggle Central Relay Arcs"
            >
              Relays: {showArcs ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Right Stack: Floating Navigation & Zoom Tools */}
        <div className="hud-nav-tools">
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
          <div style={{ padding: '0 0.25rem 0.6rem' }}>
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
                  title="Copy Lat, Lng"
                >
                  {copiedField === 'coord' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                </button>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">NETWORK PROVIDER (ISP &amp; ASN)</span>
              <span className="detail-value">{selectedVisitor.isp || selectedVisitor.org || 'Relay Node'}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">TIMEZONE &amp; LOCAL TIME</span>
              <div className="timezone-row">
                <Clock size={11} className="time-icon" />
                <span className="detail-value gold">
                  {selectedVisitor.timezone || 'UTC'} &bull; {visitorLocalTime || 'Live'}
                </span>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">IP TELEMETRY SOURCE</span>
              <span className="detail-value cyan">
                {ipstackConfigured ? 'IPSTACK PRO ENGINE' : 'IP-API RESILIENT ENGINE'}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">ESTIMATED NETWORK LATENCY</span>
              <span className="detail-value green">
                <Wifi size={11} style={{ display: 'inline', marginRight: 4 }} />
                ~28ms (WebSocket)
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
        {/* Roster Header */}
        <div className="roster-header">
          <div className="roster-title">
            <Users size={14} color="#00f3ff" />
            <span>CITIZEN ROSTER</span>
          </div>
          <span className="roster-count">{filteredVisitors.length} TRACKED</span>
        </div>

        {/* Filter Tabs */}
        <div className="roster-filter-tabs">
          <button
            type="button"
            className={`filter-tab-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            ALL ({visitors.length})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${filterType === 'members' ? 'active' : ''}`}
            onClick={() => setFilterType('members')}
          >
            MEMBERS ({membersCount})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${filterType === 'users' ? 'active' : ''}`}
            onClick={() => setFilterType('users')}
          >
            USERS ({normalUsersCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="roster-search-bar">
          <Search size={13} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search citizens, cities, IPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Visitors Scrollable List */}
        <div className="roster-list">
          {filteredVisitors.length === 0 ? (
            <div className="roster-empty">
              <Radio size={24} color="#64748b" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
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
                  className={`roster-node-item ${isSelected ? 'selected' : ''} ${
                    isAdmin ? 'current-user-node' : isMember ? 'member-user-node' : ''
                  }`}
                  onClick={() => flyToVisitor(v)}
                >
                  <div className="node-flag">{v.flag || '🌐'}</div>
                  <div className="node-info">
                    <div className="node-alias-row">
                      <span className="node-alias">@{v.alias}</span>
                      {isAdmin ? (
                        <span className="admin-chip">👑 ADMIN</span>
                      ) : isMember ? (
                        <span className="member-chip">Ω MEMBER</span>
                      ) : (
                        <span className="user-chip">CITIZEN</span>
                      )}
                    </div>
                    <div className="node-city">
                      {v.city ? `${v.city}, ` : ''}{v.country || 'Unknown Region'}
                    </div>
                    <div className="node-ip">
                      {v.ip} &bull; {v.latitude?.toFixed(2)}°, {v.longitude?.toFixed(2)}°
                    </div>
                  </div>
                  <button
                    type="button"
                    className="focus-node-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      flyToVisitor(v);
                    }}
                    title="Fly to Citizen 3D Pole"
                  >
                    <Crosshair size={13} />
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
