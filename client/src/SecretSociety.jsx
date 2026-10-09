import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lock,
  BookOpen,
  Code,
  Image as ImageIcon,
  FileText,
  PenTool,
  Search,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  AlertOctagon,
  Fingerprint,
  Loader2,
  Globe,
  Radio,
  Cpu,
  ShieldCheck,
  Zap
} from 'lucide-react';
import VectorWordmark from './components/VectorWordmark';
import './SecretSociety.css';

/* ==========================================================================
   EFFECT: THREE.JS CONTINUOUS MORPHING 3D PARTICLE MESH
   Renders 1,800 particles that smoothly and continuously transform between
   distinct 3D shapes as the user scrolls down the manifesto viewport container.
   Shapes:
     0. Torus Vortex (Hero / Core)
     1. Undulating 3D Wave Mesh Grid (The Public Room)
     2. Double-Helix Spacetime Spiral (Beyond the Ordinary)
     3. Geodesic Crystalline Sphere (Meet James)
     4. Geometric Shield Vault Cage (Why Verification Matters)
     5. Dual-Ring Planetary Field (What Shadow Talk Stands For)
     6. Infinite Warp Tunnel Cylinder (Before You Leave)
   ========================================================================== */
function ThreeSectionParticleMesh({ scrollContainerRef }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 34;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const PARTICLE_COUNT = 1800;

    // Helper: circular glowing texture
    const createParticleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(0, 243, 255, 0.85)');
      grad.addColorStop(0.65, 'rgba(168, 85, 247, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    };

    const shapes = [];

    // Shape 0: Torus Vortex (Hero / Core) - Large spinning halo
    const shape0 = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const R = 16.5;
      const r = 4.8 + (Math.random() - 0.5) * 1.5;
      shape0[i * 3] = (R + r * Math.cos(v)) * Math.cos(u);
      shape0[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u);
      shape0[i * 3 + 2] = r * Math.sin(v) + (Math.random() - 0.5) * 2;
    }
    shapes.push(shape0);

    // Shape 1: Undulating 3D Wave Mesh Grid (The Public Room) - Expansive flat wave
    const shape1 = new Float32Array(PARTICLE_COUNT * 3);
    const side = Math.floor(Math.sqrt(PARTICLE_COUNT));
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const row = Math.floor(i / side) - side / 2;
      const col = (i % side) - side / 2;
      const x = col * 1.5;
      const z = row * 1.5;
      const y = Math.sin(x * 0.28) * Math.cos(z * 0.28) * 5.5;
      shape1[i * 3] = x;
      shape1[i * 3 + 1] = y;
      shape1[i * 3 + 2] = z;
    }
    shapes.push(shape1);

    // Shape 2: Double-Helix Spacetime Spiral (Beyond the Ordinary) - High vertical DNA
    const shape2 = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = (i / PARTICLE_COUNT) * Math.PI * 8 - Math.PI * 4;
      const strand = i % 2 === 0 ? 1 : -1;
      const radius = 10.5;
      shape2[i * 3] = Math.cos(t) * radius * strand + (Math.random() - 0.5) * 1.5;
      shape2[i * 3 + 1] = t * 3.4;
      shape2[i * 3 + 2] = Math.sin(t) * radius * strand + (Math.random() - 0.5) * 1.5;
    }
    shapes.push(shape2);

    // Shape 3: Geodesic Crystalline Sphere (Meet James) - Concentric orb
    const shape3 = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * Math.PI * 2;
      const r = i < PARTICLE_COUNT * 0.7 ? 13.5 + (Math.random() - 0.5) * 2 : 5.0;
      shape3[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      shape3[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      shape3[i * 3 + 2] = r * Math.cos(theta);
    }
    shapes.push(shape3);

    // Shape 4: Geometric Shield Vault Cage (Why Verification Matters) - 3D Cube vault
    const shape4 = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const face = i % 6;
      const d = 11.5;
      const u = (Math.random() - 0.5) * d * 2;
      const v = (Math.random() - 0.5) * d * 2;
      if (face === 0) { shape4[i * 3] = d; shape4[i * 3 + 1] = u; shape4[i * 3 + 2] = v; }
      else if (face === 1) { shape4[i * 3] = -d; shape4[i * 3 + 1] = u; shape4[i * 3 + 2] = v; }
      else if (face === 2) { shape4[i * 3] = u; shape4[i * 3 + 1] = d; shape4[i * 3 + 2] = v; }
      else if (face === 3) { shape4[i * 3] = u; shape4[i * 3 + 1] = -d; shape4[i * 3 + 2] = v; }
      else if (face === 4) { shape4[i * 3] = u; shape4[i * 3 + 1] = v; shape4[i * 3 + 2] = d; }
      else { shape4[i * 3] = u; shape4[i * 3 + 1] = v; shape4[i * 3 + 2] = -d; }
    }
    shapes.push(shape4);

    // Shape 5: Dual-Ring Planetary Field (What Shadow Talk Stands For) - Globe with rings
    const shape5 = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (i < PARTICLE_COUNT * 0.32) {
        const theta = Math.acos(2 * Math.random() - 1);
        const phi = Math.random() * Math.PI * 2;
        const r = 6.0;
        shape5[i * 3] = r * Math.sin(theta) * Math.cos(phi);
        shape5[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
        shape5[i * 3 + 2] = r * Math.cos(theta);
      } else {
        const angle = Math.random() * Math.PI * 2;
        const dist = 11.5 + Math.random() * 11.5;
        shape5[i * 3] = Math.cos(angle) * dist;
        shape5[i * 3 + 1] = Math.sin(angle) * dist * 0.35 + (Math.random() - 0.5) * 1.5;
        shape5[i * 3 + 2] = Math.sin(angle) * dist * 0.8;
      }
    }
    shapes.push(shape5);

    // Shape 6: Infinite Warp Tunnel Cylinder (Before You Leave) - Deep z tunnel
    const shape6 = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 10.5 + Math.random() * 4.5;
      const z = (Math.random() - 0.5) * 60;
      shape6[i * 3] = Math.cos(angle) * radius;
      shape6[i * 3 + 1] = Math.sin(angle) * radius;
      shape6[i * 3 + 2] = z;
    }
    shapes.push(shape6);

    // Active buffer geometry
    const geometry = new THREE.BufferGeometry();
    const currentPositions = new Float32Array(shape0);
    geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));

    // Particle colors
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const colorCyan = new THREE.Color('#00f3ff');
    const colorViolet = new THREE.Color('#a855f7');
    const colorSky = new THREE.Color('#38bdf8');

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ratio = i / PARTICLE_COUNT;
      const c = ratio < 0.6 ? colorCyan.clone().lerp(colorViolet, ratio / 0.6) : colorViolet.clone().lerp(colorSky, (ratio - 0.6) / 0.4);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.3,
      map: createParticleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Reactive scroll tracking with smooth damping
    let currentScrollRatio = 0;
    let targetScrollRatio = 0;

    const computeScroll = () => {
      const vp = scrollContainerRef?.current;
      if (vp && vp.scrollHeight > vp.clientHeight) {
        targetScrollRatio = vp.scrollTop / (vp.scrollHeight - vp.clientHeight);
      } else {
        const docElem = document.documentElement;
        const max = Math.max(1, docElem.scrollHeight - window.innerHeight);
        targetScrollRatio = (window.scrollY || docElem.scrollTop || 0) / max;
      }
      targetScrollRatio = Math.min(1, Math.max(0, targetScrollRatio));
    };

    const vpEl = scrollContainerRef?.current;
    if (vpEl) {
      vpEl.addEventListener('scroll', computeScroll, { passive: true });
    }
    window.addEventListener('scroll', computeScroll, { passive: true });

    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Read real-time scroll position dynamically from the scrolling container
      computeScroll();
      currentScrollRatio += (targetScrollRatio - currentScrollRatio) * 0.14;
      const scrollRatio = currentScrollRatio;

      // Continuous orbital rotation tied to scroll
      particleSystem.rotation.y = elapsedTime * 0.06 + scrollRatio * 3.5;
      particleSystem.rotation.x = Math.sin(elapsedTime * 0.04) * 0.12 + (scrollRatio - 0.5) * 1.1;

      // Mouse camera parallax
      camera.position.x += (mouseX * 3.0 - camera.position.x) * 0.04;
      camera.position.y += (mouseY * 3.0 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      // Continuous shape blending across scroll progression
      const totalShapes = shapes.length; // 7
      const floatIndex = scrollRatio * (totalShapes - 1);
      const idxA = Math.floor(floatIndex);
      const idxB = Math.min(totalShapes - 1, idxA + 1);
      const blend = floatIndex - idxA;
      // Smooth S-curve easing
      const easeBlend = blend * blend * (3 - 2 * blend);

      const shapeA = shapes[idxA];
      const shapeB = shapes[idxB];
      const posAttr = geometry.attributes.position;
      const posArray = posAttr.array;

      for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
        const targetVal = shapeA[i] * (1 - easeBlend) + shapeB[i] * easeBlend;
        posArray[i] += (targetVal - posArray[i]) * 0.18;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (vpEl) {
        vpEl.removeEventListener('scroll', computeScroll);
      }
      window.removeEventListener('scroll', computeScroll);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [scrollContainerRef]);

  return <div ref={mountRef} className="three-particle-mesh-canvas" aria-hidden="true" />;
}

/* ==========================================================================
   EFFECT: ELASTIC TEXT COMPONENT ("ELESTIC TEXT")
   ========================================================================== */
function ElasticText({ text, className = '' }) {
  if (!text) return null;

  return (
    <span className={`elastic-text-wrapper ${className}`}>
      {text.split(' ').map((word, wordIdx) => (
        <span key={wordIdx} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {word.split('').map((char, charIdx) => (
            <span key={charIdx} className="elastic-char">
              {char}
            </span>
          ))}
          {wordIdx < text.split(' ').length - 1 && <span className="elastic-space">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

/* ==========================================================================
   EFFECT: SCOPED AXIS CURSOR (ONLY FOR SPECIFIC TECHNICAL SECTIONS)
   ========================================================================== */
function ScopedAxisCursor({ containerRef }) {
  const [pos, setPos] = useState({ x: -100, y: -100, visible: false });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        setPos({ x, y, visible: true });
      } else {
        setPos(prev => ({ ...prev, visible: false }));
      }
    };

    const handlePointerLeave = () => {
      setPos(prev => ({ ...prev, visible: false }));
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [containerRef]);

  if (!pos.visible) return null;

  return (
    <div className="axis-cursor-canvas-wrap" aria-hidden="true">
      <div className="axis-cursor-line-x" style={{ top: `${pos.y}px` }} />
      <div className="axis-cursor-line-y" style={{ left: `${pos.x}px` }} />
      <div
        className="axis-cursor-coords"
        style={{
          top: `${pos.y + 12}px`,
          left: `${pos.x + 12}px`
        }}
      >
        [{Math.round(pos.x)} // {Math.round(pos.y)}]
      </div>
    </div>
  );
}

/* ==========================================================================
   EFFECT: GLOSSY SECTION CONNECTIVITY GRAPH (BORDERLESS)
   ========================================================================== */
function SectionConnectivityGraph() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = 200);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 700;
      height = canvas.height = 200;
    };
    window.addEventListener('resize', handleResize);

    const nodes = [
      { x: 70, y: 70, label: 'Node // 01' },
      { x: 190, y: 130, label: 'Node // 02' },
      { x: 310, y: 60, label: 'Node // 03' },
      { x: 440, y: 140, label: 'Node // 04' },
      { x: 560, y: 80, label: 'Node // 05' },
      { x: 650, y: 150, label: 'Node // 06' }
    ];

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
      [0, 2], [1, 3], [2, 4], [3, 5]
    ];

    const packets = edges.map(([from, to]) => ({
      from,
      to,
      progress: Math.random(),
      speed: 0.006 + Math.random() * 0.008
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Edges
      for (const [from, to] of edges) {
        const n1 = nodes[from];
        const n2 = nodes[to];
        if (!n1 || !n2) continue;

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.22)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Live encrypted data packets
      for (const p of packets) {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const n1 = nodes[p.from];
        const n2 = nodes[p.to];
        if (!n1 || !n2) continue;

        const px = n1.x + (n2.x - n1.x) * p.progress;
        const py = n1.y + (n2.y - n1.y) * p.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.beginPath();
        ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 243, 255, 0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#00f3ff';
        ctx.fill();

        ctx.font = '10px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(n.label, n.x - 22, n.y - 12);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="section-connectivity-graph-card">
      <div className="graph-telemetry-header">
        <span className="graph-telemetry-pill">
          <Radio size={14} /> LIVE TOPOLOGY // ANONYMOUS COMMONS
        </span>
        <span>CIPHER: CHACHA20-POLY1305 &bull; 0 DISK TRACE</span>
      </div>
      <canvas ref={canvasRef} className="section-graph-canvas" />
    </div>
  );
}

/* ==========================================================================
   EFFECT: 3D GALLERY TUNNEL ("GALARY TURNEL") (BORDERLESS GLOSSY FINISH)
   ========================================================================== */
function GalleryTunnel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const tunnelItems = [
    {
      tag: 'SYNTHESIS // TECH',
      title: 'Artificial Intelligence & The World',
      desc: 'Exploring how autonomous intelligence, responsible algorithms, and decentralized architectures can improve society rather than exploit human behavior.',
      icon: <Cpu size={20} />,
      metric: 'FIELD: MACHINE INTELLIGENCE'
    },
    {
      tag: 'SOVEREIGNTY // PRIVACY',
      title: 'Anonymous Speech & Ephemeral Time',
      desc: 'Conversations that leave no permanent records. In-memory data rotation ensuring pure human expression without profile surveillance.',
      icon: <ShieldCheck size={20} />,
      metric: 'RETENTION: VOLATILE RAM'
    },
    {
      tag: 'EARTH // RESILIENCE',
      title: 'Real-World Solutions & Planet',
      desc: 'Channeling collective intelligence toward solving ecological, energetic, and practical problems to leave the world a little better than we found it.',
      icon: <Globe size={20} />,
      metric: 'DIRECTIVE: TANGIBLE IMPACT'
    },
    {
      tag: 'PHILOSOPHY // FUTURE',
      title: 'The Unanswered Cosmic Questions',
      desc: 'Investigating what the world will look like in fifty years, examining deep philosophy, science, and the possibilities waiting to be discovered.',
      icon: <Sparkles size={20} />,
      metric: 'SCOPE: UNCONVENTIONAL IDEAS'
    },
    {
      tag: 'COLLABORATION // PURPOSE',
      title: 'Curiosity Without Harm',
      desc: 'We want ideas to lead towards solutions, not suffering. Responsible exploration where curious people build rather than cause harm.',
      icon: <Zap size={20} />,
      metric: 'ETHOS: CONSTRUCTIVE DIALOGUE'
    }
  ];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? tunnelItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === tunnelItems.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="gallery-tunnel-wrapper">
      <div className="gallery-tunnel-header">
        <div className="gallery-tunnel-title">
          <Sparkles size={14} /> 3D PERSPECTIVE GALLERY TUNNEL // THEMATIC VECTORS
        </div>
        <div className="gallery-tunnel-controls">
          <button type="button" className="tunnel-control-btn" onClick={handlePrev} title="Previous Vector">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="tunnel-control-btn" onClick={handleNext} title="Next Vector">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="gallery-tunnel-viewport">
        <div className="tunnel-ring-grid" />
        <div className="gallery-tunnel-track">
          {tunnelItems.map((item, idx) => {
            const offset = idx - currentIndex;
            const absOffset = Math.abs(offset);
            const isVisible = absOffset <= 2;
            if (!isVisible) return null;

            const tz = -absOffset * 160;
            const tx = offset * 210;
            const ry = offset * -18;
            const opacity = 1 - absOffset * 0.32;
            const scale = 1 - absOffset * 0.12;

            return (
              <div
                key={idx}
                className="tunnel-card"
                onClick={() => setCurrentIndex(idx)}
                style={{
                  transform: `translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`,
                  opacity,
                  zIndex: 20 - absOffset
                }}
              >
                <div className="tunnel-card-header">
                  <span className="tunnel-card-tag">{item.tag}</span>
                  <div className="tunnel-card-icon">{item.icon}</div>
                </div>
                <div className="tunnel-card-body">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
                <div className="tunnel-card-footer">
                  <span>{item.metric}</span>
                  <span>[0{idx + 1} / 0{tunnelItems.length}]</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN MANIFESTO COMPONENT
   ========================================================================== */
export default function SecretSociety({
  onReturn,
  serverUrl = 'http://localhost:5000',
  onOpenMemberChat
}) {
  // Main scrolling viewport ref
  const viewportRef = useRef(null);

  // Scoped ref for the technical section with axis cursor
  const scopedTechnicalSectionRef = useRef(null);

  // Member authentication modal & animation states
  const [showMemberAuthModal, setShowMemberAuthModal] = useState(false);
  const [memberAlias, setMemberAlias] = useState('');
  const [memberPassphrase, setMemberPassphrase] = useState('');
  const [showPassphraseInput, setShowPassphraseInput] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [accessGrantedAnim, setAccessGrantedAnim] = useState(false);
  const [sealPulseAnim, setSealPulseAnim] = useState(false);

  // Hidden Cadence Gesture Detector: exactly 2 clicks -> wait 3s -> 4 clicks
  const gestureTimestampsRef = useRef([]);

  const handleHiddenTrigger = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    const now = Date.now();
    gestureTimestampsRef.current.push(now);
    if (gestureTimestampsRef.current.length > 12) {
      gestureTimestampsRef.current.shift();
    }

    setSealPulseAnim(true);
    setTimeout(() => setSealPulseAnim(false), 240);

    // Strict cadence check: 2 clicks -> wait ~3s (2400ms - 5000ms) -> 4 clicks
    if (gestureTimestampsRef.current.length >= 6) {
      const len = gestureTimestampsRef.current.length;
      const [c0, c1, c2, c3, c4, c5] = gestureTimestampsRef.current.slice(len - 6);

      const burst1 = c1 - c0;          // click 1 to 2 (< 1500ms)
      const waitPause = c2 - c1;       // wait ~3s (enforced 2400ms - 5000ms)
      const burst2_1 = c3 - c2;        // click 1 of 4 (< 1500ms)
      const burst2_2 = c4 - c3;        // click 2 of 4 (< 1500ms)
      const burst2_3 = c5 - c4;        // click 3 of 4 (< 1500ms)

      const isMatch =
        burst1 <= 1500 &&
        waitPause >= 2400 && waitPause <= 5000 &&
        burst2_1 <= 1500 &&
        burst2_2 <= 1500 &&
        burst2_3 <= 1500;

      if (isMatch) {
        gestureTimestampsRef.current = [];
        setAuthError('');
        setShowMemberAuthModal(true);
        if (navigator.vibrate) {
          try { navigator.vibrate([50, 40, 50]); } catch { }
        }
      }
    }
  };

  // Authenticate member passphrase with server-side endpoint
  const handleVerifyMemberPassphrase = async (e) => {
    e.preventDefault();
    if (!memberAlias.trim()) {
      setAuthError('Please enter your verified handle.');
      return;
    }
    if (!memberPassphrase.trim()) {
      setAuthError('Please enter your secret passphrase.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch(`${serverUrl}/api/secret-society/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias: memberAlias.trim(),
          passphrase: memberPassphrase.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || 'Access Denied: Invalid credentials or unverified handle.');
        setAuthLoading(false);
        return;
      }

      setAuthLoading(false);
      setAccessGrantedAnim(true);

      setTimeout(() => {
        setAccessGrantedAnim(false);
        setShowMemberAuthModal(false);
        if (typeof onOpenMemberChat === 'function') {
          onOpenMemberChat({
            alias: data.alias,
            token: data.societyToken || data.token,
            societyToken: data.societyToken || data.token,
            clearance: data.clearance || 'LEVEL-4 (INDUCTED)'
          });
        }
      }, 1800);
    } catch (err) {
      console.error('Member auth error:', err);
      setAuthError('Connection failed. Server gateway unavailable.');
      setAuthLoading(false);
    }
  };

  // Global ESC key listener to return to public room or close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showMemberAuthModal) {
          setShowMemberAuthModal(false);
        } else if (typeof onReturn === 'function') {
          onReturn();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onReturn, showMemberAuthModal]);

  return (
    <div ref={viewportRef} className="society-manifesto-viewport">
      {/* Overlays */}
      <div className="society-crt-scanlines" />
      <div className="society-vignette-overlay" />
      <div className="society-ambient-glow" />
      <div className="society-grid-overlay" />

      {/* Three.js Continuous Morphing 3D Background Particle Mesh */}
      <ThreeSectionParticleMesh scrollContainerRef={viewportRef} />

      {/* Top Header Navigation (ONLY ESC BUTTON) */}
      <header className="society-header">
        <button
          type="button"
          className="society-back-btn"
          onClick={onReturn}
          title="Return to Public Chat [ESC]"
        >
          <ArrowLeft size={16} />
          <kbd className="society-kbd">ESC</kbd>
          <span>Return to Chat</span>
        </button>
      </header>

      {/* Main Manifesto Container */}
      <main className="society-manifesto-container">
        {/* ==================================================================
            HERO SECTION
            ================================================================== */}
        <section className="manifesto-section">
          {/* User's WebGL Vector Wordmark Component */}
          <VectorWordmark
            text="SHADOW TALK"
            font={{
              fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontWeight: 900,
              fontSize: '150px',
              lineHeight: '1em',
              letterSpacing: '-0.03em'
            }}
            background="transparent"
            textColor="#ffffff"
            shade="#00f3ff"
            accent="rgba(0, 243, 255, 0.45)"
            reach={300}
            speed={45}
            damping={60}
            handles={{ size: 90, spread: 26, labels: false }}
            style={{ width: '100%', height: '220px' }}
          />

          {/* Glossy Frosted Panel for Hero Content */}
          <div className="glossy-panel">
            <div className="manifesto-section-header">
              <h2 className="manifesto-section-subtitle">
                <ElasticText text="Everyone Has Something to Say. Not Everyone Says It Under Their Name." />
              </h2>
            </div>

            <div className="manifesto-prose">
              <p className="hero-lead-text">
                You are here because you wanted to talk.
              </p>
              <p>
                Maybe you are curious about someone else&apos;s thoughts. Maybe you have questions you cannot easily ask elsewhere. Or perhaps you simply want to speak freely, without introducing yourself to the world first.
              </p>
              <p>
                Whatever brought you here, welcome to Shadow Talk.
              </p>
              <p>
                A place where strangers meet without knowing each other&apos;s names, where a simple message can become an unexpected conversation, and where the person on the other side of the screen is more than a profile.
              </p>
              <p>
                Here, you can talk without making your identity the centre of the conversation.
              </p>
              <p>
                But a conversation is only the beginning.
              </p>
            </div>

            <div className="neo-rotating-card hero-callout-neo">
              <div className="neo-border-beam" />
              <div className="neo-rotating-inner hero-callout-inner">
                <div className="neo-badge-row">
                  <span className="neo-badge-tag cyan">DISCOVERY // CONVERGENCE</span>
                </div>
                <div className="neo-callout-text flicker-text">
                  There is more to Shadow Talk than what you see at first.
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="manifesto-horizon-divider" />

        {/* ==================================================================
            THE PUBLIC ROOM
            ================================================================== */}
        <section className="manifesto-section">
          <div className="glossy-panel">
            <div className="manifesto-section-header">
              <span className="manifesto-super-tag">OPEN ACCESS // ANONYMOUS COMMONS</span>
              <h2 className="manifesto-section-title">
                <ElasticText text="THE PUBLIC ROOM" />
              </h2>
              <h3 className="manifesto-section-subtitle">
                <ElasticText text="Strangers by identity. Human by conversation." />
              </h3>
            </div>

            <div className="manifesto-prose">
              <p>
                No long introductions. No need to build a profile. No requirement to tell strangers who you are.
              </p>
              <p>
                The Public Room is open to everyone. Enter, start a conversation, exchange ideas, share your thoughts, or simply listen to what other people have to say.
              </p>
              <p>
                You might meet someone who thinks exactly like you. You might encounter someone whose perspective challenges everything you believe. You might have a conversation that lasts only a minute, or one that stays in your mind long after you leave.
              </p>
              <p>
                You decide what you share about yourself.
              </p>
              <p>
                Talk about everyday life, technology, dreams, ideas, experiences, or whatever brings people together. You don&apos;t need a reason to start a conversation. Sometimes, curiosity is reason enough.
              </p>
            </div>

            {/* Encrypted Passphrase Vault Feature Card */}
            <div className="encrypted-vault-manifesto-card">
              <div className="encrypted-vault-header">
                <div className="encrypted-vault-icon-wrap">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h4>Secret Conversations in Plain Sight</h4>
                  <span className="encrypted-vault-tag">CLIENT-SIDE AES-256 PASSPHRASE VAULT</span>
                </div>
              </div>
              <p>
                Even in an open room filled with strangers, you do not have to speak to everyone. Shadow Talk includes a client-side encrypted key vault that allows two users to communicate in complete secrecy—right inside the Public Room.
              </p>
              <p>
                When two participants agree on a private passphrase key, their messages are encrypted locally using AES-256 before leaving their devices. To everyone else in the room, the conversation appears only as scrambled ciphertext. But to the person holding the matching key, the messages decrypt instantly and seamlessly in real time.
              </p>
              <p>
                No private channel to register. No separate room to create. Just a shared key between two minds, whispering in the middle of a crowded sanctuary.
              </p>
              <div className="encrypted-vault-micro-footer">
                <span className="vault-code-snippet">
                  <Lock size={12} /> ZERO-KNOWLEDGE SERVER // CLIENT-SIDE ENCRYPTION
                </span>
                <span className="vault-hint-snippet">
                  The deepest secrets are hidden where everyone is looking.
                </span>
              </div>
            </div>

            {/* Section Connectivity Graph (Borderless Glossy) */}
            <SectionConnectivityGraph />

            <div className="manifesto-callout-quote">
              No introductions required. Just start talking.
            </div>
          </div>
        </section>

        <div className="manifesto-horizon-divider" />

        {/* ==================================================================
            BEYOND THE ORDINARY & MEET JAMES (SCOPED TECHNICAL SECTIONS)
            ================================================================== */}
        <div ref={scopedTechnicalSectionRef} className="scoped-axis-section">
          {/* Axis Cursor Scoped Only to this Technical Section */}
          <ScopedAxisCursor containerRef={scopedTechnicalSectionRef} />

          {/* Section: BEYOND THE ORDINARY */}
          <section className="manifesto-section">
            <div className="glossy-panel">
              <div className="manifesto-section-header">
                <span className="manifesto-super-tag">DEPTH // CONVERGENCE</span>
                <h2 className="manifesto-section-title">
                  <ElasticText text="BEYOND THE ORDINARY" />
                </h2>
                <h3 className="manifesto-section-subtitle">
                  <ElasticText text="Some questions don't fit inside an ordinary conversation." />
                </h3>
              </div>

              <div className="manifesto-prose">
                <p>
                  What will the world look like in fifty years?
                </p>
                <p>
                  How much of the universe remains beyond our understanding? What possibilities are waiting to be discovered? What happens when technology advances beyond what we once thought possible?
                </p>
                <p>
                  And what could happen if curious people stopped asking questions alone and started exploring them together?
                </p>
                <p>
                  Shadow Talk has a space for conversations that go deeper than everyday small talk.
                </p>
                <p>
                  The Secret Society Chat is reserved for verified members. It brings together people interested in technology, artificial intelligence, the future, science, philosophy, mysteries, unconventional ideas, and the possibilities that have yet to become reality.
                </p>
                <p>
                  It is a place to question, investigate, learn, exchange knowledge, and explore ideas with purpose.
                </p>
                <p>
                  The goal isn&apos;t simply to imagine a different world. It is to consider how we could help build a better one.
                </p>
                <p>
                  Use knowledge responsibly. Work on ideas that help people. Explore solutions to real problems. Create something useful. Leave the world a little better than you found it.
                </p>
                <p>
                  Access is restricted to verified members, but curiosity has no limit.
                </p>
              </div>

              {/* 3D Perspective Gallery Tunnel ("Galary Turnel") */}
              <GalleryTunnel />

              <div className="manifesto-callout-quote flicker-text">
                Not every interesting question has an easy answer. Not every possibility has been explored.
              </div>
            </div>
          </section>

          <div className="manifesto-horizon-divider" />

          {/* Section: MEET JAMES */}
          <section className="manifesto-section">
            <div className="glossy-panel">
              <div className="manifesto-section-header">
                <span className="manifesto-super-tag">INTELLIGENT COMPANION</span>
                <h2 className="manifesto-section-title">
                  <ElasticText text="MEET JAMES" />
                </h2>
                <h3 className="manifesto-section-subtitle">
                  <ElasticText text="Ask the question. Follow the thought. Discover what comes next." />
                </h3>
              </div>

              <div className="manifesto-prose">
                <p>
                  Sometimes you need an answer. Sometimes you need a second perspective. And sometimes, you have an idea that you don&apos;t quite know how to bring to life.
                </p>
                <p className="hero-lead-text">
                  Meet James.
                </p>
                <p>
                  James is your intelligent companion for conversations, exploration, creativity, and problem-solving. Talk with him naturally, ask questions, explore unfamiliar subjects, or work through an idea one step at a time.
                </p>
                <p>
                  You don&apos;t have to know exactly what to ask. Start with what interests you and see where the conversation leads.
                </p>
              </div>

              {/* Genuinely Available Capabilities Grid (Borderless Glossy) */}
              <div className="james-grid-container">
                <div className="james-capability-card">
                  <div className="james-cap-header">
                    <div className="james-cap-icon-box">
                      <BookOpen size={18} />
                    </div>
                    <h4>Knowledge and explanations</h4>
                  </div>
                  <p>
                    Explore subjects ranging from technology and science to history, philosophy, everyday questions, and more. Understand complex topics, examine different perspectives, and keep asking questions.
                  </p>
                </div>

                <div className="james-capability-card">
                  <div className="james-cap-header">
                    <div className="james-cap-icon-box">
                      <Code size={18} />
                    </div>
                    <h4>Code and development</h4>
                  </div>
                  <p>
                    Generate code, explore programming concepts, debug errors, and turn technical ideas into practical projects. Whether you&apos;re learning or building, James can help you work through the process.
                  </p>
                </div>

                <div className="james-capability-card">
                  <div className="james-cap-header">
                    <div className="james-cap-icon-box">
                      <ImageIcon size={18} />
                    </div>
                    <h4>Image creation</h4>
                  </div>
                  <p>
                    Describe a visual idea and bring it to life through image generation. Explore concepts, create illustrations, and experiment with different visual possibilities.
                  </p>
                </div>

                <div className="james-capability-card">
                  <div className="james-cap-header">
                    <div className="james-cap-icon-box">
                      <FileText size={18} />
                    </div>
                    <h4>Documents and PDFs</h4>
                  </div>
                  <p>
                    Create structured documents, guides, notes, reports, and PDF-ready materials. Organise your thoughts and turn scattered information into something useful.
                  </p>
                </div>

                <div className="james-capability-card">
                  <div className="james-cap-header">
                    <div className="james-cap-icon-box">
                      <PenTool size={18} />
                    </div>
                    <h4>Writing and creativity</h4>
                  </div>
                  <p>
                    Develop ideas, refine your writing, brainstorm projects, plan solutions, and explore new ways of approaching a problem.
                  </p>
                </div>

                <div className="james-capability-card">
                  <div className="james-cap-header">
                    <div className="james-cap-icon-box">
                      <Search size={18} />
                    </div>
                    <h4>Research and internet access</h4>
                  </div>
                  <p>
                    Inside the Secret Society Chat, James has access to additional capabilities, including internet access, to help investigate topics and explore available online information.
                  </p>
                </div>
              </div>

              <div className="neo-rotating-card james-enhanced-neo">
                <div className="neo-border-beam" />
                <div className="neo-rotating-inner james-enhanced-inner">
                  <div className="neo-badge-row">
                    <span className="neo-badge-tag purple">
                      <Sparkles size={12} />
                      ADVANCED SYNTHETIC PROTOCOL
                    </span>
                  </div>
                  <h4>An enhanced experience</h4>
                  <p>
                    Verified members can use the advanced features available to James in the Secret Society Chat, making it a more capable environment for technical discussions, research, creative work, and ambitious ideas.
                  </p>
                  <p className="flicker-text" style={{ color: '#00f3ff', fontWeight: 700, margin: 0 }}>
                    You bring the question. James helps you explore the possibilities.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="manifesto-horizon-divider" />

        {/* ==================================================================
            WHY VERIFICATION MATTERS
            ================================================================== */}
        <section className="manifesto-section">
          <div className="glossy-panel">
            <div className="manifesto-section-header">
              <span className="manifesto-super-tag">ACCESS ARCHITECTURE</span>
              <h2 className="manifesto-section-title">
                <ElasticText text="WHY VERIFICATION MATTERS" />
              </h2>
              <h3 className="manifesto-section-subtitle">
                <ElasticText text="Not every space needs to be open to everyone." />
              </h3>
            </div>

            <div className="manifesto-prose">
              <p>
                The Public Room is open to all. The Secret Society Chat is different.
              </p>
              <p>
                Its access is reserved for verified members, creating a more restricted environment for deeper discussions, advanced capabilities, and the exploration of ideas that deserve thoughtful attention.
              </p>
              <p>
                Verified access gives eligible users the ability to enter the Secret Society Chat and use the features available there, including an enhanced James experience.
              </p>
              <p>
                There is no paid membership tier being promised here. The distinction is verification and access.
              </p>
              <p>
                A room can be open to everyone. A community can have a different purpose.
              </p>
              <p>
                Both have their place.
              </p>
            </div>
          </div>
        </section>

        <div className="manifesto-horizon-divider" />

        {/* ==================================================================
            WHAT SHADOW TALK STANDS FOR
            ================================================================== */}
        <section className="manifesto-section">
          <div className="glossy-panel">
            <div className="manifesto-section-header">
              <span className="manifesto-super-tag">CORE PRINCIPLES</span>
              <h2 className="manifesto-section-title">
                <ElasticText text="WHAT SHADOW TALK STANDS FOR" />
              </h2>
              <h3 className="manifesto-section-subtitle">
                <ElasticText text="Curiosity without harm. Knowledge with purpose." />
              </h3>
            </div>

            <div className="manifesto-prose">
              <p>
                We believe questions should be welcomed, ideas should be explored, and knowledge should be used responsibly.
              </p>
              <p>
                Technology can solve problems. Creativity can open new possibilities. Conversations can bring different minds together. And a small idea, shared with the right people, can become something meaningful.
              </p>
              <p>
                Shadow Talk encourages learning, thoughtful discussion, responsible experimentation, collaboration, and work that benefits others.
              </p>
              <p>
                Curiosity is not a reason to cause harm. Knowledge is not an excuse to exploit people. We want ideas to lead towards solutions, not suffering.
              </p>
              <p>
                You don&apos;t have to be an expert to contribute. You don&apos;t need to have everything figured out.
              </p>
              <p>
                You only need the willingness to think, learn, listen, and make a positive difference.
              </p>
            </div>

            <div className="ethos-pillars-grid">
              <div className="ethos-pillar-card">
                <h4>Learning &amp; Thoughtful Discussion</h4>
                <p>Rigorous, open examination of ideas where substance takes precedence over personal background.</p>
              </div>
              <div className="ethos-pillar-card">
                <h4>Responsible Experimentation</h4>
                <p>Pushing technical boundaries safely to create durable, practical solutions rather than harm.</p>
              </div>
              <div className="ethos-pillar-card">
                <h4>Collaboration with Purpose</h4>
                <p>Directing human intellect toward work that improves our world and leaves it better than we found it.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="manifesto-horizon-divider" />

        {/* ==================================================================
            A NOTE ABOUT YOUR PRIVACY
            ================================================================== */}
        <section className="manifesto-section">
          <div className="glossy-panel">
            <div className="manifesto-section-header">
              <span className="manifesto-super-tag">SECURITY &amp; INTEGRITY</span>
              <h2 className="manifesto-section-title">
                <ElasticText text="A NOTE ABOUT YOUR PRIVACY" />
              </h2>
              <h3 className="manifesto-section-subtitle">
                <ElasticText text="You choose what you reveal." />
              </h3>
            </div>

            <div className="manifesto-prose">
              <p>
                You can participate in the Public Room without providing your real name or sharing your identity with other users. You remain responsible for the information you choose to disclose.
              </p>
              <p>
                Avoid sharing passwords, financial details, private documents, or other sensitive information in conversations. An anonymous display name does not guarantee complete anonymity, and it does not mean that all technical data is invisible to the platform.
              </p>
              <p>
                Respect other people&apos;s privacy, respect their boundaries, and use Shadow Talk responsibly.
              </p>
              <p>
                Freedom to communicate matters. So does keeping yourself and others safe.
              </p>
            </div>

            <div className="neo-rotating-card privacy-neo-card">
              <div className="neo-border-beam" />
              <div className="neo-rotating-inner privacy-neo-inner">
                <div className="neo-badge-row">
                  <span className="neo-badge-tag cyan">
                    <ShieldCheck size={12} />
                    SECURITY DISCLOSURE
                  </span>
                </div>
                <h4>Identity &amp; Boundary Protocol</h4>
                <p>
                  An anonymous display name does not guarantee complete anonymity. Freedom to communicate matters — so does keeping yourself and others safe. Never disclose credentials, private passwords, or sensitive personal data in conversations.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="manifesto-horizon-divider" />

        {/* ==================================================================
            BEFORE YOU LEAVE (NO BUTTONS - PURE EDITORIAL ATMOSPHERE)
            ================================================================== */}
        <section className="manifesto-section manifesto-closing-section">
          <div className="glossy-panel">
            <div className="manifesto-section-header">
              <span className="manifesto-super-tag">DEPARTURE // RETURN</span>
              <h2 className="manifesto-section-title">
                <ElasticText text="BEFORE YOU LEAVE" />
              </h2>
              <h3 className="manifesto-section-subtitle">
                <ElasticText text="You have seen the words. You have heard what this place stands for." />
              </h3>
            </div>

            <div className="manifesto-prose">
              <p>
                Perhaps you came here simply to understand Shadow Talk.
              </p>
              <p>
                Perhaps you were looking for a place to talk to strangers without revealing too much about yourself.
              </p>
              <p>
                Or perhaps one question led to another, and now you are wondering what else is possible.
              </p>
              <p>
                That is how curiosity works.
              </p>
              <p>
                You don&apos;t always know where a question will lead. You don&apos;t always recognise an opportunity when you first encounter it. And sometimes, the most interesting discoveries begin with something ordinary.
              </p>
              <p>
                The Public Room is here whenever you want to talk.
              </p>
              <p>
                Beyond it, Shadow Talk offers another environment for verified members, curious minds, and people who want to explore ideas with purpose.
              </p>
              <p>
                You don&apos;t have to discover everything today.
              </p>
            </div>

            <div className="manifesto-callout-quote flicker-text">
              Some conversations end when you leave. Some ideas follow you. And some questions are worth asking twice.
            </div>

            <div className="manifesto-prose">
              <p className="hero-lead-text">
                Welcome to Shadow Talk.
              </p>
              <p className="closing-manifesto-quote">
                Speak freely. Think deeper. Make a difference.
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.94rem' }}>
                What we stand for. What we protect. What lies beyond.
              </p>
            </div>

            {/* Privacy Note Details Box (Borderless Glossy) */}
            <div className="privacy-notice-box">
              <h4>A note on privacy</h4>
              <p>
                Your conversations are yours. Your identity doesn&apos;t need to be the centre of every conversation, and your privacy deserves to be taken seriously.
              </p>
              <p>
                Shadow Talk is designed with privacy in mind. Chat messages are automatically deleted after 24 hours, so conversations aren&apos;t intended to remain permanently available.
              </p>
              <p>
                We aim to minimise data retention and protect conversations through appropriate security measures. However, temporary storage may be necessary for the service to function, and no online platform can guarantee absolute security. Avoid sharing passwords, financial information, or other sensitive personal details.
              </p>
              <p style={{ color: '#ffffff', fontWeight: 700 }}>
                Speak freely. Share thoughtfully. Leave fewer traces.
              </p>
              <p style={{ color: '#cffafe', fontStyle: 'italic' }}>
                Some conversations disappear. The ideas they leave behind may not.
              </p>
            </div>
          </div>

          {/* Preserved Hidden Element Trigger: Atmospheric Seal (Strictly NOT styled as a button) */}
          <div
            className={`society-cta-seal ${sealPulseAnim ? 'seal-pulsing' : ''}`}
            onClick={handleHiddenTrigger}
            aria-hidden="true"
          >
            <span>Ω</span>
          </div>
        </section>

        {/* Subtle Footer Bar */}
        <footer className="society-footer-bar">
          <div>SHADOW TALK // VOLATILE RAM PROTOCOL // 24H EPHEMERAL CYCLE</div>
          <div>ZERO PERSISTENT ARTIFACTS ON DISK // ENCRYPTED TRANSIT</div>
        </footer>
      </main>

      {/* ==================================================================
          MEMBER AUTHENTICATION MODAL (UNLOCKED ONLY BY SECRET CADENCE)
          ================================================================== */}
      {showMemberAuthModal && (
        <div
          className="modal-overlay society-member-auth-overlay"
          onClick={() => setShowMemberAuthModal(false)}
        >
          <div
            className="modal-content society-member-auth-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="member-auth-header">
              <div className="member-auth-seal">
                <span>Ω</span>
              </div>
              <div className="member-auth-titles">
                <h3>SECRET SOCIETY CLEARANCE</h3>
                <span>COUNCIL PASSPHRASE AUTHENTICATION</span>
              </div>
              <button
                type="button"
                className="member-auth-close-btn"
                onClick={() => setShowMemberAuthModal(false)}
                title="Cancel"
              >
                &times;
              </button>
            </div>

            {authError && (
              <div className="member-auth-error-banner">
                <AlertOctagon size={16} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyMemberPassphrase} className="member-auth-form">
              <div className="member-auth-field">
                <label>INDUCTED ALIAS / HANDLE</label>
                <div className="member-auth-input-wrapper">
                  <Fingerprint size={16} className="field-icon" />
                  <input
                    type="text"
                    placeholder="e.g. darsha"
                    value={memberAlias}
                    onChange={(e) => setMemberAlias(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="member-auth-field">
                <label>SECRET PASSPHRASE</label>
                <div className="member-auth-input-wrapper">
                  <KeyRound size={16} className="field-icon" />
                  <input
                    type={showPassphraseInput ? 'text' : 'password'}
                    placeholder="Enter secret passphrase"
                    value={memberPassphrase}
                    onChange={(e) => setMemberPassphrase(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="passphrase-toggle-btn"
                    onClick={() => setShowPassphraseInput(!showPassphraseInput)}
                    title={showPassphraseInput ? 'Hide passphrase' : 'Show passphrase'}
                  >
                    {showPassphraseInput ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <span className="member-auth-hint">
                  Enter the strong passphrase issued to your verified profile.
                </span>
              </div>

              <div className="member-auth-actions">
                <button
                  type="button"
                  className="member-auth-btn-cancel"
                  onClick={() => setShowMemberAuthModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="member-auth-btn-submit"
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Verifying Cryptographic Hash...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>DECRYPT &amp; ENTER SANCTUARY</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================
          ACCESS GRANTED HOLOGRAPHIC TRANSITION
          ================================================================== */}
      {accessGrantedAnim && (
        <div className="society-access-granted-fullscreen">
          <div className="access-granted-card">
            <div className="granted-glitch-badge">
              <span className="dot pulse" />
              <span>COUNCIL CLEARANCE VERIFIED</span>
            </div>

            <div className="granted-crest-wrap">
              <span className="granted-crest">Ω</span>
            </div>

            <h1 className="granted-headline">ACCESS GRANTED</h1>
            <p className="granted-subline">WELCOME TO THE SECRET SOCIETY</p>

            <div className="granted-loader-bar">
              <div className="granted-loader-fill" />
            </div>

            <div className="granted-telemetry-meta">
              <span>ALIAS: @{memberAlias}</span>
              <span>CLEARANCE: LEVEL-4 (INDUCTED)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
