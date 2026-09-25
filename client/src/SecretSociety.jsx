import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  BookOpen,
  Compass,
  Award,
  ArrowLeft,
  ArrowRight,
  Terminal,
  Cpu,
  Layers,
  Flame,
  Radio,
  FileCode,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  AlertOctagon,
  Binary,
  Fingerprint,
  Zap,
  Activity,
  Skull,
  ShieldAlert,
  Globe,
  Users,
  MessageSquare,
  Share2,
  Sprout,
  Sparkles,
  Check,
  Loader2
} from 'lucide-react';
import GlobeStudy from './components/ui/globe-study';

export default function SecretSociety({ onReturn, onApply, serverUrl = 'http://localhost:5000', onOpenMemberChat }) {
  const [activeChamber, setActiveChamber] = useState(0);
  const [revealedDossiers, setRevealedDossiers] = useState({});
  const [activeDecipher, setActiveDecipher] = useState(null);
  const [decipherText, setDecipherText] = useState('');
  const [isDeciphering, setIsDeciphering] = useState(false);
  const [showHexDump, setShowHexDump] = useState(false);

  // --- Member Secret Access Modal & Gesture States ---
  const [showMemberAuthModal, setShowMemberAuthModal] = useState(false);
  const [memberAlias, setMemberAlias] = useState('');
  const [memberPassphrase, setMemberPassphrase] = useState('');
  const [showPassphraseInput, setShowPassphraseInput] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [accessGrantedAnim, setAccessGrantedAnim] = useState(false);
  const [sealPulseAnim, setSealPulseAnim] = useState(false);

  // Hidden Cadence Gesture Detector: 2 clicks -> wait ~3s -> 4 clicks
  const gestureTimestampsRef = useRef([]);

  const handleSealSecretClick = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    const now = Date.now();
    gestureTimestampsRef.current.push(now);
    if (gestureTimestampsRef.current.length > 12) {
      gestureTimestampsRef.current.shift();
    }

    // Trigger subtle visual pulse on seal
    setSealPulseAnim(true);
    setTimeout(() => setSealPulseAnim(false), 300);

    const count = gestureTimestampsRef.current.length;
    console.log(`[Secret Society Member Cadence] Seal tapped (#${count})`);

    // Check last 6 clicks: 2 clicks -> wait ~3s -> 4 clicks
    if (gestureTimestampsRef.current.length >= 6) {
      const len = gestureTimestampsRef.current.length;
      const [c0, c1, c2, c3, c4, c5] = gestureTimestampsRef.current.slice(len - 6);

      const burst1 = c1 - c0;          // click 1 to 2
      const waitPause = c2 - c1;       // wait ~3s (900ms - 8500ms)
      const burst2_1 = c3 - c2;        // click 1 of 4
      const burst2_2 = c4 - c3;        // click 2 of 4
      const burst2_3 = c5 - c4;        // click 3 of 4

      console.log(`[Member Cadence Check]
  Burst 1 gap (<=2000ms): ${burst1}ms
  Pause wait (900ms-8500ms): ${waitPause}ms
  Burst 2 gaps (<=2000ms): ${burst2_1}ms, ${burst2_2}ms, ${burst2_3}ms`);

      const isMatch =
        burst1 <= 2000 &&
        waitPause >= 900 && waitPause <= 8500 &&
        burst2_1 <= 2000 &&
        burst2_2 <= 2000 &&
        burst2_3 <= 2000;

      if (isMatch) {
        console.log('[Secret Society] MEMBER SEQUENCE VERIFIED! Opening Passphrase Challenge...');
        gestureTimestampsRef.current = [];
        setAuthError('');
        setShowMemberAuthModal(true);
        if (navigator.vibrate) {
          try { navigator.vibrate([60, 50, 60]); } catch { }
        }
      }
    }
  };

  // Authenticate member passphrase with server
  const handleVerifyMemberPassphrase = async (e) => {
    e.preventDefault();
    if (!memberAlias.trim()) {
      setAuthError('Please enter your inducted @alias.');
      return;
    }
    if (!memberPassphrase.trim()) {
      setAuthError('Please enter the secret passphrase received from the Council.');
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
        setAuthError(data.error || 'Access Denied: Invalid credentials or uninducted alias.');
        setAuthLoading(false);
        return;
      }

      // Grant Access Animation
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
      }, 1900);
    } catch (err) {
      console.error('Member auth error:', err);
      setAuthError('Connection failed. Server load balancer or enclave gateway unavailable.');
      setAuthLoading(false);
    }
  };

  // Global ESC key listener to return to public terminal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showMemberAuthModal) {
          setShowMemberAuthModal(false);
        } else {
          onReturn();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onReturn, showMemberAuthModal]);

  const [consoleLogs, setConsoleLogs] = useState([
    '[INIT] ChaCha20-Poly1305 enclave handshake established.',
    '[TELEMETRY] 42 global mesh nodes reporting zero packet loss.',
    '[BLACK-ARCHIVE] Curated dossier #104 (Sovereign Cryptography) verified.',
    '[COUNCIL] Inducted Candidate #0849 (Zurich Relay).',
    '[SHREDDER] Ephemeral 24h channel cycle: 0 artifacts stored on disk.'
  ]);

  // Real-time simulated enclave telemetry stream
  useEffect(() => {
    const events = [
      '[THE-CRYPT] 128-byte encrypted packet routed through Reykjavik relay.',
      '[THE-FOUNDRY] Member @solon committed PR to sovereign peer-to-peer daemon.',
      '[WAR-ROOM] Planetary Climate Anomaly report filed from North Atlantic Node.',
      '[PLANETARY-ACTION] Energy Decentralization Council ratified Microgrid Blueprint v4.',
      '[COUNCIL] Processing induction dossier for Candidate #0852...',
      '[EPHEMERAL] Rotating Diffie-Hellman session keys across active rings.',
      '[BLACK-ARCHIVE] Archive #089 (Decentralized State Machines) accessed.',
      '[SHREDDER] 14,290 volatile memory buffers atomized without disk traces.',
      '[SURVEILLANCE-DEFENSE] Port sweep from commercial ISP blocked and null-routed.'
    ];

    const interval = setInterval(() => {
      setConsoleLogs(prev => {
        const nextEvent = events[Math.floor(Math.random() * events.length)];
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        return [...prev.slice(-5), `[${time}] ${nextEvent}`];
      });
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  // Interactive Decryption Terminal Scramble
  const classifiedArchives = [
    {
      id: 'archive_01',
      title: 'FILE 0x4A: THE DOMESTICATION SYLLABUS',
      category: 'SUPPRESSED CURRICULUM',
      encrypted: '7f 8e 9a 1b 04 2c 99 e2 4d 11 b8 33 0a 81 7c d9 20 4f bb 71',
      decrypted:
        'Standard educational institutions do not fail by accident; they succeed in their design: producing obedient, debt-burdened functionaries incapable of autonomous computation, financial sovereignty, or cryptographic self-defense.'
    },
    {
      id: 'archive_02',
      title: 'FILE 0x8F: THE PANOPTICON APPARATUS',
      category: 'SURVEILLANCE AUDIT',
      encrypted: '3c a1 f0 88 9b 12 77 4e 05 d4 19 63 ea 28 89 0b c7 32 fa 90',
      decrypted:
        'Commercial social media platforms are psychological containment zones engineered to extract telemetry, stimulate dopamine despair, and index human behavioral weaknesses for algorithmic advertisement monopolies.'
    },
    {
      id: 'archive_03',
      title: 'FILE 0xCC: THE PEER-TO-PEER CITADEL',
      category: 'ENCLAVE ARCHITECTURE',
      encrypted: '90 e4 2b 17 c8 51 aa 08 d3 42 79 f1 b6 80 5e 3c 14 ae 6d 29',
      decrypted:
        'ShadowTalk functions as an autonomous citadel. In-memory message execution, zero persistent server databases, and peer-vetted induction ensure our enclave remains completely impenetrable to state and corporate interception.'
    },
    {
      id: 'archive_04',
      title: 'FILE 0xEE: PLANETARY STEWARDSHIP & TANGIBLE ACTION',
      category: 'EARTH RESILIENCE DIRECTIVE',
      encrypted: '1b 5c 88 f4 33 e0 92 ad 77 c4 08 fa 21 6d b5 ee 90 4a 12 c9',
      decrypted:
        'The Secret Society does not seek retreat from reality. We convene to save and improve our Earth. We coordinate decentralized solar microgrids, soil restoration blueprints, censorship-free environmental telemetry, and direct solutions to existential planetary crises.'
    }
  ];

  const triggerDecipher = (archive) => {
    if (isDeciphering) return;
    setActiveDecipher(archive.id);
    setIsDeciphering(true);
    setDecipherText('INITIATING QUANTUM RESISTANT DECRYPTION MATRIX...');

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let iteration = 0;
    const maxIterations = 20;

    const interval = setInterval(() => {
      const scrambled = archive.decrypted
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          if (index < (iteration / maxIterations) * archive.decrypted.length) {
            return archive.decrypted[index];
          }
          return characters[Math.floor(Math.random() * characters.length)];
        })
        .join('');

      setDecipherText(scrambled);
      iteration++;

      if (iteration > maxIterations) {
        clearInterval(interval);
        setDecipherText(archive.decrypted);
        setIsDeciphering(false);
      }
    }, 45);
  };

  const toggleRevealDossier = (dossierId) => {
    setRevealedDossiers(prev => ({
      ...prev,
      [dossierId]: !prev[dossierId]
    }));
  };

  const chambers = [
    {
      id: 'crypt',
      index: '01',
      code: 'VAULT_VOID',
      name: 'THE VOID PROTOCOL',
      tagline: 'Zero-Knowledge Volatile Ephemeral Comms',
      icon: <Lock size={22} />,
      color: '#00f3ff',
      tag: 'VOLATILE MEMORY ONLY',
      description:
        'A digital black hole for surveillance. Transmissions are encrypted client-side using AES-256-GCM and ephemeral ECDH session keys. No server database stores your history. Once read or after 24 hours, packets are atomized from volatile RAM with zero disk footprints.',
      features: [
        'Client-side AES-256-GCM / ChaCha20 ciphering',
        'Zero permanent disk logging — strict volatile RAM lifecycle',
        'Automatic 24-hour cryptographic memory shredder',
        'Complete immunity to ISP and state-level traffic inspection'
      ],
      codeSnippet: `// Ephemeral ECDH Handshake & Memory Shredder
const ephemeralKey = await crypto.subtle.deriveKey(
  { name: "ECDH", public: peerPubKey },
  enclavePrivateKey,
  { name: "AES-GCM", length: 256 },
  false, ["encrypt", "decrypt"]
);
// Volatile Buffer Purge Rule:
process.nextTick(() => crypto.randomFillSync(bufferPool));`
    },
    {
      id: 'library',
      index: '02',
      code: 'VAULT_ARCHIVE',
      name: 'THE BLACK ARCHIVE',
      tagline: 'The Suppressed Curriculum of Sovereign Mastery',
      icon: <BookOpen size={22} />,
      color: '#c084fc',
      tag: 'RESTRICTED COMPENDIUM',
      description:
        'Traditional academia teaches obedience, not sovereignty. The Black Archive is our covert repository of master-level knowledge: sovereign cryptography, low-level binary exploitation, Austrian economics, game theory, and unredacted geopolitical histories erased from university syllabi.',
      features: [
        'Uncensored curriculum: Zero institutional dogma or political bias',
        'Low-level binary exploitation, assembly & kernel hacking',
        'Sovereign economics, Austrian monetary theory & game theory',
        'Peer-reviewed investigations into suppressed technical histories'
      ],
      codeSnippet: `/* Black Archive Compendium Entry #042 */
Subject: Institutional Curricular Omission
Observation: Distributed consensus & financial cryptography
             are systematically omitted from academic CS.
Requirement: Reserved strictly for inducted society members.`
    },
    {
      id: 'foundry',
      index: '03',
      code: 'VAULT_FOUNDRY',
      name: 'THE PLANETARY FOUNDRY',
      tagline: 'Covert Engineering & Earth Regeneration Kernels',
      icon: <Cpu size={22} />,
      color: '#34d399',
      tag: 'ROGUE ARCHITECTURES',
      description:
        'We do not debate the future; we write the firmware and solve the crisis. In The Foundry, vetted engineers build autonomous intelligence agents (James Core), decentralized microgrids, water purification telemetry, privacy-preserving infrastructure, and open-source models engineered to defy digital monopolies and heal our planet.',
      features: [
        'Planetary resilience & decentralized solar microgrid firmware',
        'Direct collaboration with sovereign core developers',
        'Decentralized identity & anti-censorship mesh nodes',
        'Self-hosted autonomous agent architectures (James Core)'
      ],
      codeSnippet: `// Autonomous Enclave Daemon (James Core - Advanced)
class SovereignNode extends MeshRelay {
  constructor(nodeId) {
    super(nodeId, { autonomous: true, stealth: true });
    this.bindMeshProtocol("ENCLAVE_NET_v2");
    this.enablePlanetaryTelemetrySync();
  }
}`
    },
    {
      id: 'warroom',
      index: '04',
      code: 'VAULT_WARROOM',
      name: 'THE WAR ROOM',
      tagline: 'Unfiltered Ground Truth & Global Field Telemetry',
      icon: <Radio size={22} />,
      color: '#fbbf24',
      tag: 'REAL-TIME SIGNALS',
      description:
        'When geopolitical upheaval, ecological shocks, or technological suppression hit, mainstream feeds delay and manipulate. In The War Room, verified members across 40+ countries transmit raw ground-truth reports with clinical intellectual composure to formulate real-world solutions.',
      features: [
        'First-hand dispatches from members in 40+ sovereign nations',
        'Ecological & climate ground telemetry verified by peers',
        'Objective cross-examination before media distortion',
        'Strict covenant: Zero emotional hysteria, tribalism, or propaganda'
      ],
      codeSnippet: `[WAR-ROOM DISPATCH: 0x88F2]
Origin: East Asia Relay // Timestamp: Synchronized UTC
Event: Undersea telecom cable anomaly & localized outage.
Ground Truth: BGP routing hijacked at IXP level;
              Unreported across commercial news media.`
    }
  ];

  return (
    <div className="society-manifesto-viewport">
      {/* CRT Scanline & Tactical Overlays */}
      <div className="society-crt-scanlines" />
      <div className="society-vignette-overlay" />
      <div className="society-ambient-glow" />
      <div className="society-grid-overlay" />

      {/* Top Classified Telemetry Bar (Futuristic Command Ribbon) */}
      <div className="society-telemetry-ribbon">
        <div className="telemetry-item">
          <span className="telemetry-badge-dot" />
          <span className="telemetry-label">SECURITY CLEARANCE:</span>
          <span className="telemetry-value cyan">LEVEL-4 (INDUCTED)</span>
        </div>
        <div className="telemetry-separator">//</div>
        <div className="telemetry-item">
          <span className="telemetry-label">CIPHER:</span>
          <span className="telemetry-value emerald">CHACHA20-POLY1305</span>
        </div>
        <div className="telemetry-separator">//</div>
        <div className="telemetry-item">
          <span className="telemetry-label">ACTIVE NODES:</span>
          <span className="telemetry-value gold">42 RELAYS (ZURICH / TOKYO / REYKJAVIK)</span>
        </div>
        <div className="telemetry-separator">//</div>
        <div className="telemetry-item">
          <span className="telemetry-label">DISK RETENTION:</span>
          <span className="telemetry-value crimson">0.00% (STRICT RAM)</span>
        </div>
      </div>

      {/* Top Header Navigation */}
      <header className="society-header">
        <button type="button" className="society-back-btn" onClick={onReturn} title="Return to Public Chat [ESC]">
          <ArrowLeft size={16} />
          <kbd className="society-kbd">ESC</kbd>
        </button>

        {/* Hidden Trigger: Top Emblem also accepts the secret cadence */}
        <div
          className={`society-header-badge ${sealPulseAnim ? 'seal-pulsing' : ''}`}
          onClick={handleSealSecretClick}
          role="button"
          tabIndex={0}
          title="Citadel Node"
        >
          <span className="society-status-dot-pulse" />
          <span>// CODE: SHADOWTALK</span>
        </div>
      </header>

      {/* Main Enclave Container */}
      <main className="society-manifesto-container">
        {/* Hero Section: The Public Sanctuary & Worldwide Stranger Connection */}
        <section className="society-hero-section">
          <div className="society-tactical-tag">
            <Globe size={14} className="tag-icon" />
            <span>CONNECT WITH STRANGERS WORLDWIDE // ZERO IDENTITY REQUIRED</span>
          </div>

          <h1 className="society-hero-headline">
            THE SOVEREIGN CITADEL <br />
            <span className="society-gradient-text">OF THE UNTOUCHED</span>
          </h1>

          <p className="society-hero-quote">
            &ldquo;Connect with curious minds worldwide without shedding your anonymity. No surveillance feeds, no identity badges, no algorithms. Just pure human intellect meeting across encrypted space to debate, share, and solve the real problems facing our world.&rdquo;
          </p>

          <p className="society-hero-lead">
            ShadowTalk is a global sanctuary built for people to connect with strangers worldwide. Share ideas, learn suppressed perspectives, network, and engage in high-caliber intellectual debates. All transmissions execute purely in volatile memory—with zero disk retention and zero personal data stored.
          </p>

          {/* Core Public Pillars Grid */}
          <div className="society-pillars-grid">
            <div className="pillar-item">
              <div className="pillar-icon cyan"><Users size={18} /></div>
              <h4>CONNECT STRANGERS</h4>
              <p>Forge authentic bonds across borders without exchanging legal identities or phone numbers.</p>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon emerald"><Share2 size={18} /></div>
              <h4>CHAT &bull; SHARE &bull; GROW</h4>
              <p>Freely exchange technical skills, research, and uncensored perspectives across a global network.</p>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon purple"><MessageSquare size={18} /></div>
              <h4>INTELLECTUAL DEBATES</h4>
              <p>Engage in deep, rigorous debates on philosophy, cryptography, economics, and human sovereignty.</p>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon gold"><Sprout size={18} /></div>
              <h4>IMPROVE &amp; SAVE EARTH</h4>
              <p>Direct collective intelligence toward solving real-world crises—ecological, energetic, and cognitive.</p>
            </div>
          </div>

          {/* Tactical Status Cards */}
          <div className="society-hero-stats-row">
            <div className="society-stat-card">
              <div className="stat-card-header">
                <Shield size={16} className="stat-icon" />
                <span className="stat-label">IDENTITY REQUIRED</span>
              </div>
              <span className="stat-number">0%</span>
              <span className="stat-sub">Strict Zero-KYC Policy</span>
            </div>

            <div className="society-stat-card">
              <div className="stat-card-header">
                <Skull size={16} className="stat-icon red" />
                <span className="stat-label">DATA RETAINED ON DISK</span>
              </div>
              <span className="stat-number red">0 BYTES</span>
              <span className="stat-sub">Atomized in RAM every 24h</span>
            </div>

            <div className="society-stat-card">
              <div className="stat-card-header">
                <Fingerprint size={16} className="stat-icon" />
                <span className="stat-label">CANDIDATE VETTING</span>
              </div>
              <span className="stat-number">91.4%</span>
              <span className="stat-sub">Council filter rate</span>
            </div>

            <div className="society-stat-card">
              <div className="stat-card-header">
                <Radio size={16} className="stat-icon gold" />
                <span className="stat-label">GLOBAL MESH RELAYS</span>
              </div>
              <span className="stat-number gold">42</span>
              <span className="stat-sub">Across 40+ nations</span>
            </div>
          </div>
        </section>

        {/* Section 1.5: The Enigma of the Secret Society (Curiosity & Mission) */}
        <section className="society-curiosity-section">
          <div className="section-label-header">
            <span className="section-code">[00 // THE INNER CONCLAVE]</span>
            <h2>WHAT IS THE SECRET SOCIETY?</h2>
            <p className="section-subtext">
              An underground enclave embedded deep within ShadowTalk. Unseen by the public. Unsearchable by web crawlers.
            </p>
          </div>

          <div className="curiosity-manifesto-card">
            <div className="curiosity-seal-badge">
              <span>Ω</span>
            </div>

            <div className="curiosity-content">
              <h3>Zero Identity. Unspoken Truths. Tangible Earth Stewardship.</h3>
              <p>
                Inside the public chat, strangers learn and debate. But beneath the surface lies the <strong>Secret Society</strong>—an inducted inner circle where no one knows each other&apos;s real-world identity. Members are known solely by cryptographic pseudonyms and proven contributions.
              </p>

              <div className="curiosity-highlights-grid">
                <div className="curiosity-highlight">
                  <div className="highlight-tag">UNREDACTED SECRETS</div>
                  <h4>Discussions That Are Never Told</h4>
                  <p>
                    Talk candidly about suppressed discoveries, deep geopolitical mechanics, and unspoken technological realities erased from institutional curricula and media outlets.
                  </p>
                </div>

                <div className="curiosity-highlight">
                  <div className="highlight-tag">EXCLUSIVE TOOLS</div>
                  <h4>Advanced James Bot Core</h4>
                  <p>
                    Access specialized AI capabilities with Advanced James Bot—serving unredacted council briefings, planetary action blueprints, and deep technical synthesis reserved only for inducted members.
                  </p>
                </div>

                <div className="curiosity-highlight">
                  <div className="highlight-tag">REAL DECISIONS</div>
                  <h4>Working on Real Problems</h4>
                  <p>
                    We do not hide in shadows to posture. We convene to make concrete decisions and build real solutions for our Earth: decentralized energy, climate resilience, open-source food autonomy, and cognitive freedom.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Decryption Matrix Terminal */}
        <section className="society-decipher-section">
          <div className="section-label-header">
            <span className="section-code">[01 // DECRYPTION INTERFACE]</span>
            <h2>INTERCEPTED CLASSIFIED ARCHIVES</h2>
            <p className="section-subtext">
              Select an encrypted intelligence file below to execute quantum-resistant cipher decryption.
            </p>
          </div>

          <div className="decipher-terminal-card">
            <div className="decipher-tabs-row">
              {classifiedArchives.map(archive => (
                <button
                  key={archive.id}
                  type="button"
                  className={`decipher-tab-btn ${activeDecipher === archive.id ? 'active' : ''}`}
                  onClick={() => triggerDecipher(archive)}
                >
                  <Binary size={15} />
                  <span>{archive.title}</span>
                </button>
              ))}
            </div>

            <div className="decipher-screen">
              <div className="decipher-screen-header">
                <span className="terminal-prompt">$ enclave_decrypt --target=stream --cipher=chacha20</span>
                <span className={`decipher-status-tag ${isDeciphering ? 'decrypting' : activeDecipher ? 'verified' : 'idle'}`}>
                  {isDeciphering ? 'DECRYPTING STREAM...' : activeDecipher ? 'DECLASSIFIED // VERIFIED' : 'AWAITING INPUT'}
                </span>
              </div>

              <div className="decipher-screen-body">
                {activeDecipher ? (
                  <p className="decrypted-output-text">
                    <span className="output-bracket">[DECODED]:</span> {decipherText}
                  </p>
                ) : (
                  <p className="decrypted-placeholder-text">
                    &gt; Select an archive above to initialize the decryption sequence and reveal suppressed intelligence...
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: The Four Inner Chambers (Tactical Architecture) */}
        <section className="society-chambers-section">
          <div className="section-label-header">
            <span className="section-code">[02 // INNER SANCTUARY]</span>
            <h2>THE FOUR BLACK VAULTS</h2>
            <p className="section-subtext">
              What transpires inside the Enclave once candidate credentials are vetted and verified by the Council.
            </p>
          </div>

          {/* Chamber Tab Selectors */}
          <div className="chambers-tabs-list">
            {chambers.map((ch, idx) => (
              <button
                key={ch.id}
                type="button"
                className={`chamber-tab-btn ${activeChamber === idx ? 'active' : ''}`}
                onClick={() => setActiveChamber(idx)}
                style={{ '--accent': ch.color }}
              >
                <span className="tab-index">{ch.index}</span>
                <span className="tab-name">{ch.name}</span>
                <span className="tab-tag">{ch.tag}</span>
              </button>
            ))}
          </div>

          {/* Active Chamber Tactical Card */}
          {(() => {
            const current = chambers[activeChamber];
            return (
              <div
                className="active-chamber-card"
                style={{ '--chamber-color': current.color }}
              >
                <div className="chamber-card-left">
                  <div className="chamber-header-meta">
                    <div
                      className="chamber-icon-box"
                      style={{ color: current.color, borderColor: current.color }}
                    >
                      {current.icon}
                    </div>
                    <div>
                      <span className="chamber-index-badge">{current.code} // CLEARANCE REQ</span>
                      <h3 className="chamber-title">{current.name}</h3>
                    </div>
                  </div>

                  <p className="chamber-tagline">{current.tagline}</p>
                  <p className="chamber-description">{current.description}</p>

                  <div className="chamber-features-grid">
                    {current.features.map((feat, fIdx) => (
                      <div key={fIdx} className="chamber-feature-item">
                        <CheckCircle2 size={16} style={{ color: current.color, flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="chamber-actions-subrow">
                    <button
                      type="button"
                      className="hex-inspect-btn"
                      onClick={() => setShowHexDump(!showHexDump)}
                    >
                      <Binary size={14} />
                      <span>{showHexDump ? 'Hide Hex Dump' : 'Inspect Hex Dump'}</span>
                    </button>
                  </div>
                </div>

                <div className="chamber-card-right">
                  <div className="chamber-code-window">
                    <div className="code-window-bar">
                      <div className="code-window-dots">
                        <span className="dot red" />
                        <span className="dot yellow" />
                        <span className="dot green" />
                      </div>
                      <span className="code-window-title">enclave_protocol_v2.rs</span>
                    </div>
                    <pre className="chamber-code-pre">
                      <code>
                        {showHexDump
                          ? `00000000  45 4e 43 4c 41 56 45 5f  4b 45 52 4e 45 4c 5f 56  |ENCLAVE_KERNEL_V|
00000010  32 00 20 43 68 61 43 68  61 32 30 2d 50 6f 6c 79  |2. ChaCha20-Poly|
00000020  31 33 30 35 00 2a 7f 99  00 00 00 00 00 00 00 00  |1305.*..........|
00000030  e2 b8 19 a0 4c 11 8f 32  7d 09 bc f1 aa 44 20 88  |....L..2}...D .|
[KERNEL STATUS]: RAM buffers verified zero trace.`
                          : current.codeSnippet}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Section 4: Declassified Redacted Memorandums */}
        <section className="society-redacted-section">
          <div className="section-label-header">
            <span className="section-code">[03 // DECLASSIFIED FILES]</span>
            <h2>RESTRICTED MEMORANDUMS</h2>
            <p className="section-subtext">
              Tap or hover over the redacted black tapes to declassify suppressed council findings.
            </p>
          </div>

          <div className="redacted-grid">
            {/* Dossier 1 */}
            <div
              className={`redacted-card ${revealedDossiers['d1'] ? 'revealed' : ''}`}
              onClick={() => toggleRevealDossier('d1')}
            >
              <div className="redacted-card-header">
                <span className="dossier-id">MEMORANDUM #01 // ACADEMIC OMISSION</span>
                <span className="clearance-tag red">TOP SECRET</span>
              </div>
              <p className="redacted-card-body">
                Centralized universities intentionally redact instruction on{' '}
                <span
                  className="redacted-text"
                  title="Click or hover to reveal"
                >
                  sovereign zero-knowledge cryptography, private monetary networks, and low-level kernel reverse engineering
                </span>{' '}
                to ensure engineers remain dependent on state and corporate cloud architectures.
              </p>
              <div className="redacted-card-footer">
                <span className="redacted-hint">Hover or tap to declassify</span>
                <span className="dossier-hash">SHA256: e8b9...44a1</span>
              </div>
            </div>

            {/* Dossier 2 */}
            <div
              className={`redacted-card ${revealedDossiers['d2'] ? 'revealed' : ''}`}
              onClick={() => toggleRevealDossier('d2')}
            >
              <div className="redacted-card-header">
                <span className="dossier-id">MEMORANDUM #02 // THE ATTENTION CARTEL</span>
                <span className="clearance-tag yellow">RESTRICTED</span>
              </div>
              <p className="redacted-card-body">
                The public internet is not broken; it is functioning as intended:{' '}
                <span
                  className="redacted-text"
                  title="Click or hover to reveal"
                >
                  fragmenting attention spans into 15-second intervals to prevent deep technical synthesis and sovereign coordination
                </span>
                . In ShadowTalk, signal is guarded with uncompromising intellectual maturity.
              </p>
              <div className="redacted-card-footer">
                <span className="redacted-hint">Hover or tap to declassify</span>
                <span className="dossier-hash">SHA256: 9f01...b28c</span>
              </div>
            </div>

            {/* Dossier 3 */}
            <div
              className={`redacted-card ${revealedDossiers['d3'] ? 'revealed' : ''}`}
              onClick={() => toggleRevealDossier('d3')}
            >
              <div className="redacted-card-header">
                <span className="dossier-id">MEMORANDUM #03 // PLANETARY CONVENING</span>
                <span className="clearance-tag cyan">CODE BLACK</span>
              </div>
              <p className="redacted-card-body">
                Secret Society members coordinate across{' '}
                <span
                  className="redacted-text"
                  title="Click or hover to reveal"
                >
                  42 sovereign relays to fund and engineer real open-source solutions for ecological survival, micro-agriculture, and distributed power
                </span>
                . True secrecy serves as a shield for tangible planetary preservation.
              </p>
              <div className="redacted-card-footer">
                <span className="redacted-hint">Hover or tap to declassify</span>
                <span className="dossier-hash">SHA256: 3c7a...dd90</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Global Sovereign Mesh Relays (Interactive Globe Study) */}
        <section className="society-globe-section">
          <div className="section-label-header">
            <span className="section-code">[04 // GLOBAL TELEMETRY &amp; RELAYS]</span>
            <h2>THE SOVEREIGN ORBITAL MESH</h2>
            <p className="section-subtext">
              42 autonomous relays active across 40+ nations. Drag to rotate the clandestine mesh, scroll to zoom, click any coordinate to pin tactical telemetry.
            </p>
          </div>

          <div className="globe-interactive-card">
            <div className="globe-card-header">
              <div className="globe-header-left">
                <span className="globe-dot pulse" />
                <span className="globe-title">ORBITAL_SURVEILLANCE_INDEX // LATITUDE_MESH_v2</span>
              </div>
              <span className="globe-badge">INTERACTIVE // REAL-TIME CANVAS</span>
            </div>
            <div className="globe-canvas-wrapper">
              <GlobeStudy mode="dark" scale={1} />
            </div>
            <div className="globe-card-footer">
              <div className="globe-footer-stat">
                <span className="stat-key">COORDINATES:</span>
                <span className="stat-val">ZURICH [47.37°N] &bull; TOKYO [35.67°N] &bull; REYKJAVIK [64.14°N] &bull; TAIPEI [25.03°N]</span>
              </div>
              <div className="globe-footer-stat">
                <span className="stat-key">SURVEILLANCE DEFENSE:</span>
                <span className="stat-val cyan">ACTIVE NULL-ROUTING</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Real-time Clandestine Telemetry Stream */}
        <section className="society-console-section">
          <div className="console-window">
            <div className="console-header-bar">
              <div className="console-header-left">
                <span className="terminal-dot red" />
                <span className="terminal-dot yellow" />
                <span className="terminal-dot green" />
                <span className="console-title">SHADOWTALK_MESH_TELEMETRY.log</span>
              </div>
              <span className="console-status-pill">LIVE CLANDESTINE PULSE</span>
            </div>
            <div className="console-body">
              {consoleLogs.map((log, idx) => (
                <div key={idx} className="console-log-row">
                  <span className="console-caret">&gt;</span>
                  <span className="console-log-text">{log}</span>
                </div>
              ))}
              <div className="console-log-row blinking-row">
                <span className="console-caret">&gt;</span>
                <span className="console-cursor">_</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: The Threshold of Induction & Secret Access Seal */}
        <section className="society-cta-container">
          <div className="society-cta-glass-card">
            {/* Hidden Cadence Seal (2 clicks -> wait 3s -> 4 clicks) */}
            <div
              className={`society-cta-seal ${sealPulseAnim ? 'seal-pulsing' : ''}`}
              onClick={handleSealSecretClick}
              role="button"
              tabIndex={0}
              title="Citadel Seal // Inducted Sequence Sensor"
            >
              <span>Ω</span>
            </div>

            <div className="society-cta-badge">RESTRICTED VETTING PROTOCOL</div>

            <h2 className="cta-headline">THE THRESHOLD OF INDUCTION</h2>
            <p className="cta-description">
              Induction into the Secret Society cannot be bought. It is conferred exclusively to serious thinkers, autodidacts, and builders who submit authentic credentials to solve real problems and solemnly swear the Sovereign Covenant.
            </p>

            <div className="cta-warning-callout">
              <AlertOctagon size={18} className="callout-icon" />
              <span>
                Fictitious dossiers, trolls, and noise agents are permanently rejected and blacklisted from the mesh.
              </span>
            </div>

            <div className="cta-buttons-wrap">
              <button
                type="button"
                className="cta-primary-btn"
                onClick={onApply}
              >
                <Fingerprint size={18} />
                <span>Submit Candidate Dossier for Council Vetting</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="cta-secondary-btn"
                onClick={onReturn}
              >
                <span>Return to Public Chat [ESC]</span>
              </button>
            </div>
          </div>
        </section>

        {/* Tactical Footer */}
        <footer className="society-footer-bar">
          <div className="footer-meta-row">
            <span>ENCLAVE CITADEL // LEVEL-4 PROTOCOL // CIPHER: CHACHA20-POLY1305</span>
            <span>ZERO PERSISTENT ARTIFACTS // REYKJAVIK &bull; ZURICH &bull; TOKYO &bull; TAIPEI</span>
          </div>
        </footer>
      </main>

      {/* --- Secret Member Passphrase Modal (Triggered by 2 clicks -> wait 3s -> 4 clicks) --- */}
      {showMemberAuthModal && (
        <div className="modal-overlay society-member-auth-overlay" onClick={() => setShowMemberAuthModal(false)}>
          <div className="modal-content society-member-auth-card" onClick={e => e.stopPropagation()}>
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
                    placeholder="e.g. solon or cipher_walker"
                    value={memberAlias}
                    onChange={e => setMemberAlias(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="member-auth-field">
                <label>SECRET PASSPHRASE (FROM COUNCIL EMAIL)</label>
                <div className="member-auth-input-wrapper">
                  <KeyRound size={16} className="field-icon" />
                  <input
                    type={showPassphraseInput ? 'text' : 'password'}
                    placeholder="e.g. OMEGA-HORIZON-7492"
                    value={memberPassphrase}
                    onChange={e => setMemberPassphrase(e.target.value)}
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
                  Enter the strong passphrase generated by the Council Admin and dispatched to your email.
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

      {/* --- ACCESS GRANTED HOLOGRAPHIC TRANSITION ANIMATION --- */}
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
              <span>CIPHER: CHACHA20-POLY1305</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
