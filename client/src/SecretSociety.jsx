import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Eye,
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
  ShieldAlert
} from 'lucide-react';
import GlobeStudy from './components/ui/globe-study';

export default function SecretSociety({ onReturn, onApply }) {
  const [activeChamber, setActiveChamber] = useState(0);
  const [revealedDossiers, setRevealedDossiers] = useState({});
  const [activeDecipher, setActiveDecipher] = useState(null);
  const [decipherText, setDecipherText] = useState('');
  const [isDeciphering, setIsDeciphering] = useState(false);
  const [showHexDump, setShowHexDump] = useState(false);

  // Global ESC key listener to return to public terminal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onReturn();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onReturn]);

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
      '[WAR-ROOM] New ground dispatch submitted from Taipei Node (Verified).',
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
      name: 'THE BLACK FOUNDRY',
      tagline: 'Covert Engineering & Autonomous Agent Kernels',
      icon: <Cpu size={22} />,
      color: '#34d399',
      tag: 'ROGUE ARCHITECTURES',
      description:
        'We do not debate the future; we write the firmware. In The Foundry, vetted engineers and researchers build autonomous intelligence agents (James Core), peer-to-peer mesh protocols, privacy-preserving infrastructure, and local-first AI models engineered to defy digital authoritarianism.',
      features: [
        'Direct collaboration with sovereign core developers',
        'Decentralized identity & anti-censorship mesh nodes',
        'Self-hosted autonomous agent architectures (James Core)',
        'Clandestine code repositories and cryptographic mirrors'
      ],
      codeSnippet: `// Autonomous Enclave Daemon (James Core)
class SovereignNode extends MeshRelay {
  constructor(nodeId) {
    super(nodeId, { autonomous: true, stealth: true });
    this.bindMeshProtocol("ENCLAVE_NET_v2");
    this.enableZeroTraceRouting();
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
        'When geopolitical upheaval or technological shockwaves hit, mainstream news feeds delay, sanitize, and manipulate. In The War Room, verified members situated across 40+ countries transmit raw, clinical ground-truth reports with absolute intellectual composure.',
      features: [
        'First-hand dispatches from members in 40+ sovereign nations',
        'Objective peer cross-examination before media syndication',
        'Live intelligence on regulatory shifts, cyber events & markets',
        'Strict covenant: Zero emotional panic, tribalism, or disinformation'
      ],
      codeSnippet: `[WAR-ROOM DISPATCH: 0x88F2]
Origin: East Asia Relay // Timestamp: Synchronized UTC
Event: Undersea telecom cable anomaly detected.
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
          <span className="telemetry-value gold">42 RELAYS (ZURICH / TOKYO / TAIPEI)</span>
        </div>
        <div className="telemetry-separator">//</div>
        <div className="telemetry-item">
          <span className="telemetry-label">DISK RETENTION:</span>
          <span className="telemetry-value crimson">0.00% (STRICT RAM)</span>
        </div>
      </div>

      {/* Top Header Navigation */}
      <header className="society-header">
        <button type="button" className="society-back-btn" onClick={onReturn} title="Return [ESC]">
          <ArrowLeft size={16} />
          <kbd className="society-kbd">ESC</kbd>
        </button>

        <div className="society-header-badge">
          <span className="society-status-dot-pulse" />
          <span>// CODE: SHADOWTALK</span>
        </div>
      </header>

      {/* Main Enclave Container */}
      <main className="society-manifesto-container">
        {/* Hero Section: Terrifying, Futuristic, Uncompromising */}
        <section className="society-hero-section">
          <div className="society-tactical-tag">
            <ShieldAlert size={14} className="tag-icon" />
            <span>CLASSIFIED PROTOCOL // UNAUTHORIZED INTERCEPTION PROHIBITED</span>
          </div>

          <h1 className="society-hero-headline">
            THE SOVEREIGN CITADEL <br />
            <span className="society-gradient-text">OF THE UNTOUCHED</span>
          </h1>

          <p className="society-hero-quote">
            &ldquo;You were not educated. You were domesticated. The modern syllabus was engineered to manufacture compliant cogs for century-old monopolies. ShadowTalk is the underground counter-intelligence sanctuary where autodidacts, cryptographers, and sovereign builders convene in the dark.&rdquo;
          </p>

          <p className="society-hero-lead">
            This is not a social network. There are no algorithmic dopamine feeds, no public vanity metrics, and zero data retained on disk. Initiated members access covert research vaults, coordinate autonomous software builds, and transmit unfiltered ground-truth intelligence across a peer-to-peer encrypted mesh.
          </p>

          {/* Tactical Status Cards */}
          <div className="society-hero-stats-row">
            <div className="society-stat-card">
              <div className="stat-card-header">
                <Shield size={16} className="stat-icon" />
                <span className="stat-label">SURVEILLANCE IMMUNITY</span>
              </div>
              <span className="stat-number">100%</span>
              <span className="stat-sub">Client-side AES-256</span>
            </div>

            <div className="society-stat-card">
              <div className="stat-card-header">
                <Skull size={16} className="stat-icon red" />
                <span className="stat-label">DATA LOGGED ON DISK</span>
              </div>
              <span className="stat-number red">0 BYTES</span>
              <span className="stat-sub">Shredded every 24h</span>
            </div>

            <div className="society-stat-card">
              <div className="stat-card-header">
                <Fingerprint size={16} className="stat-icon" />
                <span className="stat-label">CANDIDATE DISCARD</span>
              </div>
              <span className="stat-number">91.4%</span>
              <span className="stat-sub">Strict vetting filter</span>
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

        {/* Section 4: Declassified Redacted Memorandums (Glitch & Hover Reveal) */}
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
                <span className="dossier-id">MEMORANDUM #03 // CITADEL SOVEREIGNTY</span>
                <span className="clearance-tag cyan">CODE BLACK</span>
              </div>
              <p className="redacted-card-body">
                Verified members coordinate peer-to-peer across{' '}
                <span
                  className="redacted-text"
                  title="Click or hover to reveal"
                >
                  42 sovereign relays with zero third-party telemetry, zero advertisement trackers, and zero central points of failure
                </span>
                . The Verified Blue Tick is an induction honor earned exclusively through candidate vetting.
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

        {/* Section 7: The Threshold of Induction (CTA) */}
        <section className="society-cta-container">
          <div className="society-cta-glass-card">
            <div className="society-cta-seal">
              <span>Ω</span>
            </div>

            <div className="society-cta-badge">RESTRICTED VETTING PROTOCOL</div>

            <h2 className="cta-headline">THE THRESHOLD OF INDUCTION</h2>
            <p className="cta-description">
              Induction into the Inner Circle cannot be purchased. It is conferred exclusively to serious students, autodidacts, and builders who submit authentic credentials and solemnly swear the Covenant of Maturity.
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
                <span>Return [ESC]</span>
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
    </div>
  );
}
