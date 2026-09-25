import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Globe,
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
  ZoomOut
} from 'lucide-react';
import './GeoGlobe3D.css';

/**
 * Convert Latitude and Longitude to 3D Sphere Cartesian Coordinates
 * Standard geographic mapping:
 * lat: -90 (South) to +90 (North)
 * lon: -180 (West) to +180 (East)
 */
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/**
 * Procedural Equirectangular World Map Texture Generator
 * Draws high-detail landmasses, country boundaries, coastlines, coordinate graticules,
 * and country labels onto a 2048x1024 Canvas mapped seamlessly onto the Three.js sphere.
 */
function createDetailedWorldMapTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  const w = canvas.width;
  const h = canvas.height;

  // Helper to map lon/lat to canvas (x, y)
  // lon: -180..+180 -> 0..w
  // lat: +90..-90   -> 0..h
  const toX = (lon) => ((lon + 180) / 360) * w;
  const toY = (lat) => ((90 - lat) / 180) * h;

  // 1. Google Maps Earth Natural Ocean Blue Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, '#5da5dc');
  oceanGrad.addColorStop(0.2, '#539ad6');
  oceanGrad.addColorStop(0.5, '#418ecd');
  oceanGrad.addColorStop(0.8, '#539ad6');
  oceanGrad.addColorStop(1, '#5da5dc');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // Soft Coastal Shelf Water Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fillRect(0, 0, w, h);

  // 2. Coordinate Graticule Grid (Delicate White Lines)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 0.75;

  // Longitude Meridians (every 15 degrees)
  for (let lon = -180; lon <= 180; lon += 15) {
    ctx.beginPath();
    ctx.moveTo(toX(lon), 0);
    ctx.lineTo(toX(lon), h);
    ctx.stroke();
  }

  // Latitude Parallels (every 15 degrees)
  for (let lat = -75; lat <= 75; lat += 15) {
    ctx.beginPath();
    ctx.moveTo(0, toY(lat));
    ctx.lineTo(w, toY(lat));
    ctx.stroke();
  }

  // Equator, Tropics, and Prime Meridian
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1.0;
  // Equator (0 deg)
  ctx.beginPath();
  ctx.moveTo(0, toY(0));
  ctx.lineTo(w, toY(0));
  ctx.stroke();

  // Greenwich Prime Meridian (0 deg)
  ctx.beginPath();
  ctx.moveTo(toX(0), 0);
  ctx.lineTo(toX(0), h);
  ctx.stroke();

  // Tropic of Cancer (23.5 N) & Capricorn (23.5 S)
  ctx.setLineDash([3, 5]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath();
  ctx.moveTo(0, toY(23.5));
  ctx.lineTo(w, toY(23.5));
  ctx.moveTo(0, toY(-23.5));
  ctx.lineTo(w, toY(-23.5));
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Country & Continent Vector Definitions
  // Detailed polygon contours for all continents and major countries
  const countries = [
    // --- NORTH AMERICA ---
    {
      name: 'CANADA',
      code: 'CA',
      center: [56, -106],
      pts: [
        [-140, 70], [-130, 72], [-115, 75], [-95, 76], [-80, 74], [-60, 65], [-55, 52],
        [-65, 45], [-80, 45], [-90, 48], [-95, 49], [-125, 49], [-130, 55], [-140, 60], [-140, 70]
      ]
    },
    {
      name: 'UNITED STATES',
      code: 'US',
      center: [39, -98],
      pts: [
        [-125, 49], [-95, 49], [-90, 48], [-80, 45], [-70, 45], [-67, 44], [-75, 35],
        [-80, 25], [-82, 25], [-85, 30], [-90, 29], [-97, 26], [-105, 31], [-117, 32],
        [-124, 38], [-125, 49]
      ]
    },
    {
      name: 'ALASKA (US)',
      code: 'US-AK',
      center: [64, -152],
      pts: [[-168, 65], [-150, 71], [-140, 70], [-140, 60], [-153, 58], [-165, 60], [-168, 65]]
    },
    {
      name: 'MEXICO',
      code: 'MX',
      center: [23, -102],
      pts: [
        [-117, 32], [-105, 31], [-97, 26], [-97, 20], [-90, 21], [-87, 21], [-90, 18],
        [-93, 16], [-96, 16], [-105, 20], [-110, 24], [-115, 30], [-117, 32]
      ]
    },
    {
      name: 'CENTRAL AMERICA',
      code: 'CA-REG',
      center: [14, -86],
      pts: [[-93, 16], [-90, 18], [-83, 15], [-80, 9], [-77, 8], [-83, 8], [-90, 13], [-93, 16]]
    },
    {
      name: 'CARIBBEAN',
      code: 'CB',
      center: [21, -78],
      pts: [[-84, 22], [-75, 20], [-68, 18], [-62, 16], [-66, 18], [-78, 20], [-84, 22]]
    },

    // --- SOUTH AMERICA ---
    {
      name: 'BRAZIL',
      code: 'BR',
      center: [-14, -51],
      pts: [
        [-60, 5], [-50, 2], [-44, -2], [-35, -5], [-35, -10], [-39, -18], [-44, -23],
        [-48, -26], [-53, -25], [-58, -20], [-60, -10], [-70, -4], [-67, 2], [-60, 5]
      ]
    },
    {
      name: 'ARGENTINA',
      code: 'AR',
      center: [-38, -63],
      pts: [
        [-65, -22], [-58, -22], [-57, -30], [-60, -38], [-65, -45], [-68, -55], [-72, -52],
        [-70, -42], [-69, -32], [-68, -24], [-65, -22]
      ]
    },
    {
      name: 'CHILE',
      code: 'CL',
      center: [-35, -71],
      pts: [[-70, -18], [-68, -24], [-70, -35], [-73, -45], [-75, -53], [-72, -54], [-71, -40], [-70, -18]]
    },
    {
      name: 'COLOMBIA & VENEZUELA',
      code: 'CO-VE',
      center: [6, -68],
      pts: [[-78, 2], [-76, 8], [-72, 12], [-62, 10], [-60, 5], [-67, 2], [-75, -2], [-78, 2]]
    },
    {
      name: 'PERU & BOLIVIA',
      code: 'PE-BO',
      center: [-15, -68],
      pts: [[-81, -5], [-75, -2], [-68, -10], [-58, -18], [-65, -22], [-70, -18], [-77, -12], [-81, -5]]
    },

    // --- EUROPE ---
    {
      name: 'UNITED KINGDOM',
      code: 'GB',
      center: [55, -3],
      pts: [[-5, 50], [0, 51], [1.5, 52.5], [0, 55], [-2, 58], [-5, 58], [-5, 55], [-5, 50]]
    },
    {
      name: 'IRELAND',
      code: 'IE',
      center: [53, -8],
      pts: [[-10, 51.5], [-6, 52], [-6, 54.5], [-10, 54], [-10, 51.5]]
    },
    {
      name: 'FRANCE',
      code: 'FR',
      center: [46, 2],
      pts: [[-4.5, 48.5], [0, 50], [3, 51], [7, 49], [7, 44], [3, 42.5], [-1.5, 43.5], [-1, 46], [-4.5, 48.5]]
    },
    {
      name: 'GERMANY',
      code: 'DE',
      center: [51, 10],
      pts: [[6, 51], [8, 54], [10, 54.5], [14, 54], [15, 51], [13, 48], [8, 48], [6, 49.5], [6, 51]]
    },
    {
      name: 'SPAIN & PORTUGAL',
      code: 'ES-PT',
      center: [40, -4],
      pts: [[-9, 43], [-1, 43.5], [3, 42.5], [3, 41], [0, 38], [-5, 36], [-9, 37], [-9.5, 42], [-9, 43]]
    },
    {
      name: 'ITALY',
      code: 'IT',
      center: [42, 12],
      pts: [[7, 45], [12, 46], [14, 45], [13, 42], [18, 40.5], [16, 38], [14, 40], [10, 44], [7, 45]]
    },
    {
      name: 'SCANDINAVIA',
      code: 'SE-NO-FI',
      center: [62, 16],
      pts: [[5, 60], [10, 64], [18, 70], [28, 70], [30, 65], [25, 60], [18, 58], [12, 56], [5, 60]]
    },
    {
      name: 'POLAND & EASTERN EU',
      code: 'PL-UA',
      center: [50, 24],
      pts: [[14, 54], [22, 54], [30, 52], [36, 50], [35, 46], [28, 45], [18, 48], [15, 51], [14, 54]]
    },

    // --- AFRICA ---
    {
      name: 'EGYPT',
      code: 'EG',
      center: [26, 30],
      pts: [[25, 31.5], [34, 31.5], [35, 28], [36, 22], [25, 22], [25, 31.5]]
    },
    {
      name: 'NORTH AFRICA (ALGERIA/LIBYA)',
      code: 'NA-REG',
      center: [28, 12],
      pts: [[-10, 30], [0, 35], [10, 37], [20, 33], [25, 31.5], [25, 22], [12, 19], [-5, 22], [-10, 30]]
    },
    {
      name: 'WEST AFRICA (NIGERIA/GHANA)',
      code: 'WA-REG',
      center: [10, 5],
      pts: [[-17, 14], [-12, 5], [-5, 5], [5, 4], [12, 5], [14, 13], [0, 15], [-15, 15], [-17, 14]]
    },
    {
      name: 'EAST AFRICA (KENYA/ETHIOPIA)',
      code: 'EA-REG',
      center: [5, 38],
      pts: [[32, 15], [42, 12], [51, 10], [42, -4], [35, -4], [30, 3], [32, 15]]
    },
    {
      name: 'CENTRAL AFRICA (CONGO)',
      code: 'CA-AFR',
      center: [-2, 22],
      pts: [[12, 5], [20, 4], [30, 3], [30, -10], [20, -12], [12, -6], [12, 5]]
    },
    {
      name: 'SOUTH AFRICA',
      code: 'ZA',
      center: [-29, 25],
      pts: [[14, -22], [25, -22], [32, -26], [30, -31], [25, -34], [18, -34], [14, -28], [14, -22]]
    },
    {
      name: 'MADAGASCAR',
      code: 'MG',
      center: [-19, 47],
      pts: [[44, -12], [50, -14], [48, -25], [44, -25], [44, -12]]
    },

    // --- ASIA & MIDDLE EAST ---
    {
      name: 'INDIA',
      code: 'IN',
      center: [21, 78],
      pts: [
        [68, 24], [72, 30], [77, 35], [80, 31], [88, 27], [90, 22], [85, 20], [80, 16],
        [80, 12], [77.5, 8], [76, 10], [73, 16], [70, 21], [68, 24]
      ]
    },
    {
      name: 'CHINA',
      code: 'CN',
      center: [35, 104],
      pts: [
        [75, 38], [85, 48], [105, 52], [122, 53], [130, 46], [122, 40], [122, 30],
        [118, 24], [108, 22], [100, 22], [95, 28], [80, 31], [75, 38]
      ]
    },
    {
      name: 'JAPAN',
      code: 'JP',
      center: [36, 138],
      pts: [[130, 32], [134, 34], [139, 36], [141, 41], [145, 44], [141, 45], [137, 37], [130, 32]]
    },
    {
      name: 'SOUTH KOREA',
      code: 'KR',
      center: [36, 128],
      pts: [[126, 38], [129, 38], [130, 35], [126, 34], [126, 38]]
    },
    {
      name: 'SOUTHEAST ASIA',
      code: 'SEA-REG',
      center: [14, 102],
      pts: [[98, 18], [105, 20], [109, 18], [108, 12], [104, 9], [100, 5], [98, 8], [98, 18]]
    },
    {
      name: 'INDONESIA',
      code: 'ID',
      center: [-2, 118],
      pts: [
        [95, 5], [105, -5], [115, -8], [125, -8], [140, -5], [135, 0], [120, 2], [108, 2], [95, 5]
      ]
    },
    {
      name: 'PHILIPPINES',
      code: 'PH',
      center: [13, 122],
      pts: [[120, 18], [125, 15], [126, 8], [121, 6], [119, 10], [120, 18]]
    },
    {
      name: 'MIDDLE EAST (SAUDI/UAE/IRAN)',
      code: 'ME-REG',
      center: [25, 45],
      pts: [
        [35, 32], [45, 38], [55, 37], [62, 32], [60, 24], [55, 20], [50, 13], [43, 13],
        [38, 20], [35, 32]
      ]
    },
    {
      name: 'RUSSIA / SIBERIA',
      code: 'RU',
      center: [60, 95],
      pts: [
        [30, 65], [60, 70], [80, 73], [110, 75], [140, 72], [170, 66], [180, 65],
        [170, 58], [140, 52], [120, 52], [85, 48], [60, 52], [40, 55], [30, 65]
      ]
    },
    {
      name: 'AUSTRALIA',
      code: 'AU',
      center: [-25, 133],
      pts: [
        [114, -22], [122, -15], [135, -12], [142, -11], [148, -20], [153, -28], [150, -37],
        [140, -38], [130, -32], [120, -34], [115, -34], [114, -22]
      ]
    },
    {
      name: 'NEW ZEALAND',
      code: 'NZ',
      center: [-41, 174],
      pts: [[167, -46], [174, -41], [178, -37], [174, -36], [171, -42], [167, -46]]
    },

    // --- ANTARCTICA ---
    {
      name: 'ANTARCTICA',
      code: 'AQ',
      center: [-80, 0],
      pts: [
        [-180, -78], [-120, -74], [-60, -65], [-30, -75], [0, -70], [60, -68],
        [120, -66], [160, -70], [180, -78], [180, -90], [-180, -90], [-180, -78]
      ]
    }
  ];

  // Draw Country Landmasses with Natural Google Earth Color Palette
  countries.forEach(country => {
    if (!country.pts || country.pts.length < 3) return;

    ctx.beginPath();
    const firstX = toX(country.pts[0][0]);
    const firstY = toY(country.pts[0][1]);
    ctx.moveTo(firstX, firstY);

    for (let i = 1; i < country.pts.length; i++) {
      ctx.lineTo(toX(country.pts[i][0]), toY(country.pts[i][1]));
    }
    ctx.closePath();

    // Natural terrain fill based on geographical climate
    let landFill = '#73ab5a'; // Natural lush vegetation green
    if (country.code === 'AQ' || country.code === 'GL') {
      landFill = '#f0f4f8'; // Polar ice white
    } else if (['SA', 'EG', 'DZ', 'LY', 'SD', 'TD', 'NE', 'ML', 'MR', 'IR', 'IQ', 'OM', 'YE'].includes(country.code)) {
      landFill = '#dfcca0'; // Arid desert cream (Sahara & Arabia)
    } else if (country.code === 'AU') {
      landFill = '#d6b885'; // Australian outback ochre
    } else if (country.code === 'IN') {
      landFill = '#7cb366'; // India fertile green
    } else if (country.code === 'CN' || country.code === 'RU') {
      landFill = '#85b572'; // Temperate Eurasia
    }

    ctx.fillStyle = landFill;
    ctx.fill();

    // Delicate crisp white/gray border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Country Label (Clean Google Maps style typography)
    if (country.center) {
      const cx = toX(country.center[1]);
      const cy = toY(country.center[0]);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(country.name, cx, cy);
    }
  });

  // India State Divisions & State Codes (as in Google Maps Earth View)
  const indiaStates = [
    { code: 'TS', name: 'Telangana', lon: 79.0, lat: 17.8 },
    { code: 'AP', name: 'Andhra Pradesh', lon: 80.6, lat: 15.9 },
    { code: 'MH', name: 'Maharashtra', lon: 75.7, lat: 19.7 },
    { code: 'KA', name: 'Karnataka', lon: 75.8, lat: 14.8 },
    { code: 'TN', name: 'Tamil Nadu', lon: 78.6, lat: 11.1 },
    { code: 'KL', name: 'Kerala', lon: 76.2, lat: 10.5 },
    { code: 'GJ', name: 'Gujarat', lon: 71.1, lat: 22.2 },
    { code: 'RJ', name: 'Rajasthan', lon: 73.8, lat: 26.5 },
    { code: 'MP', name: 'Madhya Pradesh', lon: 77.4, lat: 23.2 },
    { code: 'UP', name: 'Uttar Pradesh', lon: 80.9, lat: 26.8 },
    { code: 'OD', name: 'Odisha', lon: 84.8, lat: 20.5 },
    { code: 'WB', name: 'West Bengal', lon: 87.8, lat: 23.0 },
    { code: 'DL', name: 'Delhi', lon: 77.2, lat: 28.6 }
  ];

  ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
  ctx.font = '700 9px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  indiaStates.forEach(st => {
    ctx.fillText(st.code, toX(st.lon), toY(st.lat));
  });

  // Major World Cities with Google Maps locator dots & clean text
  const worldCities = [
    { name: 'Hyderabad', lon: 78.48, lat: 17.38, isHub: true },
    { name: 'Bengaluru', lon: 77.59, lat: 12.97 },
    { name: 'Mumbai', lon: 72.87, lat: 19.07 },
    { name: 'New Delhi', lon: 77.20, lat: 28.61 },
    { name: 'Chennai', lon: 80.27, lat: 13.08 },
    { name: 'Kolkata', lon: 88.36, lat: 22.57 },
    { name: 'Tokyo', lon: 139.69, lat: 35.68 },
    { name: 'London', lon: -0.12, lat: 51.50 },
    { name: 'Zurich', lon: 8.54, lat: 47.37 },
    { name: 'New York', lon: -74.00, lat: 40.71 },
    { name: 'San Francisco', lon: -122.41, lat: 37.77 },
    { name: 'Singapore', lon: 103.81, lat: 1.35 },
    { name: 'Dubai', lon: 55.27, lat: 25.20 },
    { name: 'Stockholm', lon: 18.06, lat: 59.32 },
    { name: 'Berlin', lon: 13.40, lat: 52.52 },
    { name: 'Paris', lon: 2.35, lat: 48.85 },
    { name: 'Sydney', lon: 151.20, lat: -33.86 }
  ];

  worldCities.forEach(city => {
    const cx = toX(city.lon);
    const cy = toY(city.lat);

    // City locator dot
    ctx.fillStyle = city.isHub ? '#ea4335' : '#475569';
    ctx.beginPath();
    ctx.arc(cx, cy, city.isHub ? 3.5 : 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = city.isHub ? '#1e293b' : '#334155';
    ctx.font = city.isHub ? 'bold 9.5px system-ui, sans-serif' : '500 8.5px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(city.name, cx + 5, cy + 3);
  });

  // Ocean and Sea Names in Soft Water Blue Italic
  const seas = [
    { name: 'Arabian Sea', lon: 65, lat: 18 },
    { name: 'Bay of Bengal', lon: 88, lat: 15 },
    { name: 'Laccadive Sea', lon: 74, lat: 8 },
    { name: 'Indian Ocean', lon: 80, lat: -10 },
    { name: 'Red Sea', lon: 38, lat: 22 },
    { name: 'Philippine Sea', lon: 130, lat: 18 },
    { name: 'South Atlantic Ocean', lon: -18, lat: -25 },
    { name: 'North Atlantic Ocean', lon: -40, lat: 32 },
    { name: 'Pacific Ocean', lon: -160, lat: 10 }
  ];

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'italic 10.5px system-ui, sans-serif';
  ctx.textAlign = 'center';
  seas.forEach(sea => {
    ctx.fillText(sea.name, toX(sea.lon), toY(sea.lat));
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export default function GeoGlobe3D({ adminToken, serverUrl }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const globeGroupRef = useRef(null);
  const markersGroupRef = useRef(null);
  const animFrameRef = useRef(null);

  // Smooth interpolation refs for Google Maps style zoom and centering
  const targetRotRef = useRef(null);
  const targetZoomRef = useRef(null);

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
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
          const preferred = list.find(v => v.isCurrentAdmin || v.isLocal) || list[0];
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

  // Initialize Three.js Scene, Realistic Earth Globe, Atmosphere, and Controls
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 520;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 230);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // 3. Globe Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    const GLOBE_RADIUS = 75;

    // Google Maps Earth Texture with Detailed World Countries, India States & Major Cities
    const worldMapTexture = createDetailedWorldMapTexture();

    // Natural Earth Base Sphere
    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const sphereMat = new THREE.MeshBasicMaterial({
      map: worldMapTexture,
      transparent: false
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphereMesh);

    // Soft Atmospheric Corona Glow (Google Earth Limb Blue)
    const atmosphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.055, 48, 48);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.32
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphereMesh);

    // Subtle Satellite & Space Dust Particles
    const particleCount = 350;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = GLOBE_RADIUS * (1.15 + Math.random() * 0.4);
      particlePos[i] = r * Math.sin(phi) * Math.cos(theta);
      particlePos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePos[i + 2] = r * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 1.4,
      transparent: true,
      opacity: 0.45
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    globeGroup.add(particles);

    // Markers Group (Pins and Arcs)
    const markersGroup = new THREE.Group();
    markersGroupRef.current = markersGroup;
    globeGroup.add(markersGroup);

    // 4. Mouse Drag & Orbit Controls
    let isDragging = false;
    let dragDistance = 0;
    let previousMousePosition = { x: 0, y: 0 };
    const domElement = renderer.domElement;

    const onMouseDown = (e) => {
      isDragging = true;
      dragDistance = 0;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      dragDistance += Math.abs(deltaX) + Math.abs(deltaY);

      globeGroup.rotation.y += deltaX * 0.006;
      globeGroup.rotation.x += deltaY * 0.006;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      targetZoomRef.current = null; // override auto zoom
      camera.position.z = Math.max(115, Math.min(320, camera.position.z + e.deltaY * 0.16));
    };

    // Raycast Pin Clicks
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const onCanvasClick = (e) => {
      if (dragDistance > 6) return; // Ignore drag release
      const rect = domElement.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(markersGroup.children, true);
      if (intersects.length > 0) {
        let hitObj = intersects[0].object;
        while (hitObj && !hitObj.userData?.visitor && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        if (hitObj?.userData?.visitor) {
          flyToVisitor(hitObj.userData.visitor);
        }
      }
    };

    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('click', onCanvasClick);

    // Touch support for trackpad & mobile
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        dragDistance = 0;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;
      dragDistance += Math.abs(deltaX) + Math.abs(deltaY);

      globeGroup.rotation.y += deltaX * 0.008;
      globeGroup.rotation.x += deltaY * 0.008;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { isDragging = false; };

    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 5. Animation Loop with Smooth Camera Zoom & Position Interpolation
    let pulseScale = 1;
    let pulseDir = 0.015;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Smooth Rotation to Target on Locate/Click
      if (targetRotRef.current) {
        globeGroup.rotation.x += (targetRotRef.current.x - globeGroup.rotation.x) * 0.08;
        globeGroup.rotation.y += (targetRotRef.current.y - globeGroup.rotation.y) * 0.08;
        if (
          Math.abs(targetRotRef.current.x - globeGroup.rotation.x) < 0.001 &&
          Math.abs(targetRotRef.current.y - globeGroup.rotation.y) < 0.001
        ) {
          targetRotRef.current = null;
        }
      } else if (autoRotate && !isDragging) {
        globeGroup.rotation.y += 0.0018;
      }

      // Smooth Camera Zoom-in to target (e.g. 125 close-up level)
      if (targetZoomRef.current !== null) {
        camera.position.z += (targetZoomRef.current - camera.position.z) * 0.08;
        if (Math.abs(targetZoomRef.current - camera.position.z) < 0.6) {
          targetZoomRef.current = null;
        }
      }

      // Radar pulse effect on ground disc
      pulseScale += pulseDir;
      if (pulseScale > 1.4) pulseDir = -0.015;
      if (pulseScale < 0.9) pulseDir = 0.015;

      markersGroup.children.forEach(child => {
        if (child.userData?.isPulseRing) {
          child.scale.set(pulseScale, pulseScale, pulseScale);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // 6. Window Resize Listener
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('click', onCanvasClick);
      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      worldMapTexture.dispose();
    };
  }, [autoRotate]);

  // Update 3D Google Maps Teardrop Pins, Great-Circle Linking Arcs, & Waypoints
  useEffect(() => {
    if (!markersGroupRef.current) return;
    const group = markersGroupRef.current;

    // Clear previous markers
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }

    const GLOBE_RADIUS = 75;

    visitors.forEach((visitor) => {
      if (typeof visitor.latitude !== 'number' || typeof visitor.longitude !== 'number') return;

      const pos = latLonToVector3(visitor.latitude, visitor.longitude, GLOBE_RADIUS);
      const isSelected = selectedVisitor?.id === visitor.id;
      const isCurrentAdmin = visitor.isCurrentAdmin || visitor.isLocal;
      const isMember = visitor.userTier === 'member';

      // Tier Color Palette: Admin (Gold #fbbf24), Member (Emerald #10b981), Normal User (Cyan #00f3ff)
      let pinColorHex = visitor.tierColor || '#00f3ff';
      if (isSelected) {
        pinColorHex = '#f43f5e'; // Highlight active selection in Rose Red
      }
      const pinColor = new THREE.Color(pinColorHex);

      // --- PIN ROOT CONTAINER ---
      const pinContainer = new THREE.Group();
      pinContainer.position.copy(pos);
      // Orient perpendicular outward from globe center
      pinContainer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
      pinContainer.userData = { visitor };

      // 1. Ground Radar Contact Disc
      const groundDiscGeo = new THREE.RingGeometry(1.6, 3.4, 24);
      const groundDiscMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.85 : 0.45
      });
      const groundDisc = new THREE.Mesh(groundDiscGeo, groundDiscMat);
      groundDisc.rotation.x = Math.PI / 2;
      groundDisc.userData = { isPulseRing: true, visitor };
      pinContainer.add(groundDisc);

      // 2. Base Contact Dot
      const contactGeo = new THREE.CircleGeometry(1.2, 16);
      const contactMat = new THREE.MeshBasicMaterial({ color: pinColor, side: THREE.DoubleSide });
      const contactDot = new THREE.Mesh(contactGeo, contactMat);
      contactDot.rotation.x = Math.PI / 2;
      contactDot.position.y = 0.05;
      contactDot.userData = { visitor };
      pinContainer.add(contactDot);

      // 3. Google Maps 3D Teardrop Pin Stalk (Tapered Cone pointing down to surface)
      const pinHeight = isSelected ? 7.5 : (isCurrentAdmin ? 6.5 : 5.5);
      const pinHeadY = pinHeight;

      const stalkGeo = new THREE.ConeGeometry(isCurrentAdmin ? 1.6 : 1.3, pinHeight, 16);
      stalkGeo.translate(0, pinHeight / 2, 0); // Base at 0, top at pinHeight
      const stalkMat = new THREE.MeshBasicMaterial({ color: pinColor });
      const stalkMesh = new THREE.Mesh(stalkGeo, stalkMat);
      stalkMesh.userData = { visitor };
      pinContainer.add(stalkMesh);

      // 4. Pin Head Sphere
      const headRadius = isSelected ? 2.8 : (isCurrentAdmin ? 2.5 : 2.2);
      const headGeo = new THREE.SphereGeometry(headRadius, 18, 18);
      const headMat = new THREE.MeshBasicMaterial({ color: pinColor });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.y = pinHeadY;
      headMesh.userData = { visitor };
      pinContainer.add(headMesh);

      // 5. Pin Inner Dot (White contrast center)
      const innerDotGeo = new THREE.SphereGeometry(headRadius * 0.45, 12, 12);
      const innerDotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const innerDotMesh = new THREE.Mesh(innerDotGeo, innerDotMat);
      innerDotMesh.position.y = pinHeadY;
      innerDotMesh.userData = { visitor };
      pinContainer.add(innerDotMesh);

      // 6. Halo Glow if selected or Admin
      if (isSelected || isCurrentAdmin) {
        const glowGeo = new THREE.SphereGeometry(headRadius * 1.5, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
          color: pinColor,
          transparent: true,
          opacity: 0.28
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.position.y = pinHeadY;
        pinContainer.add(glowMesh);
      }

      group.add(pinContainer);

      // --- 3D GREAT-CIRCLE LINKING ARC (FOR MEMBERS ONLY) ---
      // Connects detected IP location to declared location in candidate application
      if (isMember && visitor.declaredCoords && typeof visitor.declaredCoords.lat === 'number') {
        const declaredPos = latLonToVector3(
          visitor.declaredCoords.lat,
          visitor.declaredCoords.lon,
          GLOBE_RADIUS
        );

        // Calculate elevated midpoint for curved 3D trajectory
        const midPoint = pos.clone().add(declaredPos).multiplyScalar(0.5);
        const dist = pos.distanceTo(declaredPos);
        const arcPeak = Math.max(14, dist * 0.38);
        midPoint.normalize().multiplyScalar(GLOBE_RADIUS + arcPeak);

        const curve = new THREE.QuadraticBezierCurve3(pos, midPoint, declaredPos);
        const curvePoints = curve.getPoints(45);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const arcMat = new THREE.LineBasicMaterial({
          color: isSelected ? 0x10b981 : 0x059669,
          transparent: true,
          opacity: isSelected ? 0.95 : 0.55,
          linewidth: isSelected ? 2 : 1
        });
        const arcLine = new THREE.Line(arcGeo, arcMat);
        group.add(arcLine);

        // Declared Location Secondary Waypoint
        const declaredMarker = new THREE.Group();
        declaredMarker.position.copy(declaredPos);
        declaredMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), declaredPos.clone().normalize());

        const declBaseGeo = new THREE.RingGeometry(1.2, 2.5, 16);
        const declBaseMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b, // Amber waypoint
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        });
        const declBase = new THREE.Mesh(declBaseGeo, declBaseMat);
        declBase.rotation.x = Math.PI / 2;
        declaredMarker.add(declBase);

        const declPinGeo = new THREE.SphereGeometry(1.5, 12, 12);
        const declPinMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const declPin = new THREE.Mesh(declPinGeo, declPinMat);
        declPin.position.y = 3.5;
        declaredMarker.add(declPin);

        group.add(declaredMarker);
      }
    });
  }, [visitors, selectedVisitor]);

  // Smoothly rotate globe and zoom in close (Google Maps Earth style)
  const flyToVisitor = (visitor) => {
    setSelectedVisitor(visitor);
    setAutoRotate(false); // Stop rotation immediately on locate / click

    if (!globeGroupRef.current || typeof visitor.latitude !== 'number' || typeof visitor.longitude !== 'number') return;

    // Calculate target rotation to face selected visitor directly
    const targetY = -((visitor.longitude + 90) * (Math.PI / 180));
    const targetX = (visitor.latitude * (Math.PI / 180)) * 0.45;

    targetRotRef.current = { x: targetX, y: targetY };
    targetZoomRef.current = 125; // Smooth zoom into close inspection range
  };

  const resetViewZoom = () => {
    targetZoomRef.current = 230; // Zoom out to global view
    setAutoRotate(true);
  };

  const copyToClipboard = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filter visitors: Only real online users
  const filteredVisitors = useMemo(() => {
    let result = visitors;

    if (filterType === 'members') {
      result = result.filter(v => v.userTier === 'member' || v.userTier === 'admin');
    } else if (filterType === 'users') {
      result = result.filter(v => v.userTier === 'user');
    }

    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(v =>
      (v.alias && v.alias.toLowerCase().includes(q)) ||
      (v.city && v.city.toLowerCase().includes(q)) ||
      (v.region && v.region.toLowerCase().includes(q)) ||
      (v.country && v.country.toLowerCase().includes(q)) ||
      (v.ip && v.ip.toLowerCase().includes(q)) ||
      (v.isp && v.isp.toLowerCase().includes(q)) ||
      (v.tierLabel && v.tierLabel.toLowerCase().includes(q))
    );
  }, [visitors, searchQuery, filterType]);

  const membersCount = visitors.filter(v => v.userTier === 'member' || v.userTier === 'admin').length;
  const normalUsersCount = visitors.filter(v => v.userTier === 'user').length;

  return (
    <div className="geo-globe-container">
      {/* 3D WebGL Canvas Layer */}
      <div className="globe-canvas-viewport" ref={containerRef} />

      {/* Top HUD Telemetry Bar */}
      <div className="globe-hud-overlay top-left">
        <div className="globe-telemetry-badge">
          <Globe size={14} className="cyan-spin" />
          <span>GOOGLE MAPS EARTH 3D // REAL-TIME GEOLOCATION</span>
        </div>
        <div className="globe-stats-pill">
          <span className="live-radar-dot" />
          <span>{visitors.length} REAL CONNECTED CITIZENS ACROSS THE GLOBE</span>
        </div>
        <div className="ipstack-indicator">
          <span className={`ipstack-dot ${ipstackConfigured ? 'active' : 'fallback'}`} />
          <span>{ipstackConfigured ? 'IPSTACK TELEMETRY: REAL-TIME VERIFIED' : 'IP-API ENHANCED DUAL RESOLUTION'}</span>
        </div>
      </div>

      {/* Floating Controls Bar */}
      <div className="globe-hud-overlay top-right">
        <button
          type="button"
          className={`globe-toggle-btn ${autoRotate ? 'active' : ''}`}
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle Earth Auto-Rotation"
        >
          <RefreshCw size={13} className={autoRotate ? 'spin-slow' : ''} />
          <span>{autoRotate ? 'ORBIT: ACTIVE' : 'ORBIT: LOCKED'}</span>
        </button>

        <button
          type="button"
          className="globe-toggle-btn"
          onClick={resetViewZoom}
          title="Zoom out to Global Perspective"
        >
          <ZoomOut size={13} />
          <span>GLOBAL VIEW</span>
        </button>

        <button
          type="button"
          className="globe-toggle-btn"
          onClick={() => {
            const adminNode = visitors.find(v => v.isCurrentAdmin || v.isLocal);
            if (adminNode) flyToVisitor(adminNode);
          }}
          title="Center on Your Exact Location"
        >
          <Compass size={13} />
          <span>LOCATE ADMIN</span>
        </button>

        <button
          type="button"
          className="globe-toggle-btn"
          onClick={fetchVisitors}
          title="Refresh Node Telemetry"
        >
          <Radio size={13} />
          <span>POLL USERS</span>
        </button>
      </div>

      {/* Left/Bottom Detailed Visitor Telemetry Dossier */}
      {selectedVisitor && (
        <div className="globe-visitor-card">
          <div className="visitor-card-header">
            <div className="visitor-card-title">
              <span className="flag-icon">{selectedVisitor.flag || '🌐'}</span>
              <div>
                <div className="visitor-name-row">
                  <h4>@{selectedVisitor.alias}</h4>
                  {selectedVisitor.isCurrentAdmin ? (
                    <span className="current-admin-tag">👑 ROOT ADMIN</span>
                  ) : selectedVisitor.userTier === 'member' ? (
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
            <span className="status-pill live">
              ONLINE // LIVE WEBSOCKET
            </span>
          </div>

          {/* MEMBER TELEMETRY CROSS-REFERENCE (For Council Members) */}
          {(selectedVisitor.userTier === 'member' || selectedVisitor.locationRelation) && (
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
                  <span>{selectedVisitor.source || 'IPStack'}</span>
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
      )}

      {/* Right Drawer: Live Online Visitors Roster (No Relays / No Offline) */}
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
              const isCurrent = v.isCurrentAdmin || v.isLocal;
              const isMember = v.userTier === 'member';

              return (
                <div
                  key={v.id}
                  className={`roster-node-item ${isSelected ? 'selected' : ''} ${isCurrent ? 'current-user-node' : ''} ${isMember ? 'member-user-node' : ''}`}
                  onClick={() => flyToVisitor(v)}
                >
                  <span className="node-flag">{v.flag || '🌐'}</span>
                  <div className="node-info">
                    <div className="node-alias-row">
                      <span className="node-alias">@{v.alias}</span>
                      {isCurrent ? (
                        <span className="admin-chip">ADMIN</span>
                      ) : isMember ? (
                        <span className="member-chip">MEMBER</span>
                      ) : (
                        <span className="user-chip">USER</span>
                      )}
                    </div>
                    <span className="node-city">
                      {v.city}{v.region ? `, ${v.region}` : ''} • {v.countryCode}
                    </span>
                    <span className="node-ip">{v.ip}</span>
                  </div>
                  <button
                    type="button"
                    className="focus-node-btn"
                    title="Zoom in to coordinates"
                    onClick={(e) => {
                      e.stopPropagation();
                      flyToVisitor(v);
                    }}
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
