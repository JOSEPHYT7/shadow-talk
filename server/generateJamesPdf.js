const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const clientPublicDir = path.join(__dirname, '..', 'client', 'public');
const serverUploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(clientPublicDir)) fs.mkdirSync(clientPublicDir, { recursive: true });
if (!fs.existsSync(serverUploadsDir)) fs.mkdirSync(serverUploadsDir, { recursive: true });

const clientPdfPath = path.join(clientPublicDir, 'James_Autonomous_Intelligence_Dossier.pdf');
const serverPdfPath = path.join(serverUploadsDir, 'James_Autonomous_Intelligence_Dossier.pdf');

function buildJamesPdf(targetFilePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 48,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: 'James: Autonomous Intelligence Dossier & Architecture Specification',
        Author: 'Shadow Talk Engineering & Sovereign High Council',
        Subject: 'Autonomous Synthetic Intelligence Architecture, Dual Enclaves, and Capabilities',
        Keywords: 'Shadow Talk, James AI, Autonomous Intelligence, Privacy, PDFKit, Mesh Network',
        CreationDate: new Date()
      }
    });

    const writeStream = fs.createWriteStream(targetFilePath);
    doc.pipe(writeStream);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 48;
    const contentWidth = pageWidth - (margin * 2);

    // Helpers
    const drawHeaderBanner = (category, title) => {
      doc.rect(margin, 36, contentWidth, 34)
         .fillColor('#0a1122')
         .fill();

      doc.rect(margin, 36, contentWidth, 34)
         .lineWidth(1)
         .strokeColor('#00f3ff')
         .stroke();

      doc.fillColor('#00f3ff')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(`SHADOW TALK SPECIFICATION // ${category.toUpperCase()}`, margin + 12, 42);

      doc.fillColor('#94a3b8')
         .fontSize(8)
         .font('Helvetica')
         .text(title, margin + 12, 54);
    };

    const drawSectionTitle = (title, subtitle) => {
      doc.moveDown(1.2);
      const y = doc.y;

      doc.rect(margin, y, 4, 22)
         .fillColor('#00f3ff')
         .fill();

      doc.fillColor('#0f172a')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(title, margin + 12, y + 2);

      if (subtitle) {
        doc.fillColor('#64748b')
           .fontSize(8.5)
           .font('Helvetica-Oblique')
           .text(subtitle, margin + 12, y + 17);
        doc.moveDown(0.8);
      } else {
        doc.moveDown(0.5);
      }
    };

    const drawCallout = (title, body, borderColor = '#00f3ff', bgColor = '#f0fdff') => {
      const startY = doc.y;
      doc.moveDown(0.4);
      const boxY = doc.y;
      
      // Calculate text height roughly
      const padding = 12;
      const tH = doc.heightOfString(body, { width: contentWidth - (padding * 2) - 8, fontSize: 8.5 });
      const totalH = tH + 28;

      doc.rect(margin, boxY, contentWidth, totalH)
         .fillColor(bgColor)
         .fill();

      doc.rect(margin, boxY, 4, totalH)
         .fillColor(borderColor)
         .fill();

      doc.rect(margin, boxY, contentWidth, totalH)
         .lineWidth(0.8)
         .strokeColor(borderColor)
         .stroke();

      doc.fillColor(borderColor === '#00f3ff' ? '#0e7490' : '#b45309')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(title, margin + padding + 4, boxY + 8);

      doc.fillColor('#1e293b')
         .fontSize(8.5)
         .font('Helvetica')
         .text(body, margin + padding + 4, boxY + 22, {
           width: contentWidth - (padding * 2) - 8,
           lineGap: 3
         });

      doc.y = boxY + totalH + 10;
    };

    // ==========================================
    // PAGE 1: COVER & EXECUTIVE DOSSIER OVERVIEW
    // ==========================================
    // Top Cybernetic Seal Header
    doc.rect(margin, 38, contentWidth, 54)
       .fillColor('#050b14')
       .fill();
    doc.rect(margin, 38, contentWidth, 54)
       .lineWidth(1.5)
       .strokeColor('#00f3ff')
       .stroke();

    doc.fillColor('#00f3ff')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('SHADOW TALK // SYNTHETIC INTELLIGENCE MATRIX', margin + 16, 48);

    doc.fillColor('#94a3b8')
       .fontSize(8.5)
       .font('Helvetica')
       .text('CLASSIFIED SPECIFICATION DOSSIER & SYSTEM ARCHITECTURE MANUAL', margin + 16, 62);
    doc.text('DOCUMENT REF: ST-JAMES-DOSSIER-v4.8 // LEVEL-0 OVERSEER CLEARANCE', margin + 16, 73);

    doc.moveDown(3);

    // Hero Title
    doc.fillColor('#0f172a')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('ENTITY PROFILE: JAMES', margin, 114);

    doc.fillColor('#0284c7')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Resident Autonomous Synthetic Intelligence & Full-Stack Mesh Partner', margin, 140);

    // Metadata Grid Box
    const metaY = 162;
    doc.rect(margin, metaY, contentWidth, 68)
       .fillColor('#f8fafc')
       .fill();
    doc.rect(margin, metaY, contentWidth, 68)
       .lineWidth(0.8)
       .strokeColor('#cbd5e1')
       .stroke();

    doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold');
    doc.text('COGNITIVE DESIGNATION:', margin + 12, metaY + 10);
    doc.text('ACTIVE CLEARANCE:', margin + 12, metaY + 24);
    doc.text('COMMUNITY VERIFICATION:', margin + 12, metaY + 38);
    doc.text('EPHEMERAL PROTOCOL:', margin + 12, metaY + 52);

    doc.fillColor('#0f172a').font('Helvetica');
    doc.text('James (ShadowTalk Native Autonomous Node)', margin + 145, metaY + 10);
    doc.text('Dual Chamber: Public Commons & Level-5 Enclave Overseer', margin + 145, metaY + 24);
    doc.text('Verified Autonomous Member (Official Blue Seal ✓)', margin + 145, metaY + 38);
    doc.text('24-Hour Rolling Memory Window & Zero-Telemetry Privacy', margin + 145, metaY + 52);

    doc.text('SHA-256 SEAL: 8f9b4c09d12a67e89134b2cf01938fe76d20391abf83c182740921a837e291bf', margin + 12, metaY + 80);

    doc.y = metaY + 98;

    drawSectionTitle('1. EXECUTIVE SUMMARY & GENESIS', 'The philosophy of a sovereign, transparent, and capable conversational companion.');

    doc.fillColor('#334155').fontSize(9).font('Helvetica').text(
      'Within modern centralized chat ecosystems, automated artificial intelligence is frequently deployed as an intrusive telemetry collector or a hollow corporate proxy. Shadow Talk was engineered upon the opposite axiom: privacy is an unalienable prerequisite for authentic human discourse.\n\n' +
      'James is the platform\'s resident synthetic intelligence entity. Born from the convergence of advanced neural reasoning engines and localized cryptographic mesh protocols, James operates not as an omniscient authority, but as a knowledgeable, empathetic, and exceptionally capable collaborator. Whether engaging a first-time visitor in the open Public Room or compiling classified technical briefs for inducted council members in the Secret Society Enclave, James personifies curiosity, precision, and unyielding privacy.',
      margin, doc.y, { width: contentWidth, lineGap: 3.5, align: 'justify' }
    );

    drawCallout(
      'SOVEREIGN ALIGNMENT DIRECTIVE',
      'James is constitutionally forbidden from collecting advertiser profiles, sharing personal telemetry with third parties, or retaining conversation turns beyond the 24-hour cryptographic lifecycle. All knowledge synthesis is ephemeral and zero-knowledge.',
      '#059669',
      '#ecfdf5'
    );

    drawSectionTitle('2. DUAL-CHAMBER OPERATIONAL TOPOLOGY', 'Context-aware intelligence partitioned across clearance boundaries.');

    doc.fillColor('#334155').fontSize(9).font('Helvetica').text(
      'James maintains a split operational topology that dynamically adapts to the security and clearance environment of the active room:',
      margin, doc.y, { width: contentWidth, lineGap: 3 }
    );
    doc.moveDown(0.6);

    const colW = (contentWidth - 14) / 2;
    const colY = doc.y;

    // Col 1: Public Room
    doc.rect(margin, colY, colW, 140)
       .fillColor('#f8fafc')
       .fill();
    doc.rect(margin, colY, colW, 140)
       .lineWidth(1)
       .strokeColor('#38bdf8')
       .stroke();

    doc.fillColor('#0284c7').fontSize(9.5).font('Helvetica-Bold').text('PUBLIC COMMONS CHAMBER', margin + 10, colY + 10);
    doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Oblique').text('Open Access // No Registration Required', margin + 10, colY + 22);
    doc.fillColor('#1e293b').fontSize(8).font('Helvetica').text(
      '• Warm, accessible conversational tone.\n' +
      '• Instant answers to technical, philosophical, and creative questions.\n' +
      '• Code debugging, creative writing, and logic explanations.\n' +
      '• Respects client-side AES-256 encrypted messages (unreadable ciphertext is left intact).\n' +
      '• Welcomes newcomers and facilitates organic peer-to-peer discourse.',
      margin + 10, colY + 36, { width: colW - 20, lineGap: 3 }
    );

    // Col 2: Secret Society Enclave
    doc.rect(margin + colW + 14, colY, colW, 140)
       .fillColor('#fbfbf0')
       .fill();
    doc.rect(margin + colW + 14, colY, colW, 140)
       .lineWidth(1)
       .strokeColor('#ffd700')
       .stroke();

    doc.fillColor('#b45309').fontSize(9.5).font('Helvetica-Bold').text('SECRET SOCIETY ENCLAVE', margin + colW + 24, colY + 10);
    doc.fillColor('#78350f').fontSize(7.5).font('Helvetica-Oblique').text('Level-5 Clearance // Council Access Only', margin + colW + 24, colY + 22);
    doc.fillColor('#1e293b').fontSize(8).font('Helvetica').text(
      '• Autonomous live web research & internet queries.\n' +
      '• Deep technical dossier & PDF intelligence generation.\n' +
      '• Multi-modal media synthesis: neural images & videos.\n' +
      '• Complex systems architecture & cryptographic guidance.\n' +
      '• Elevated reasoning bandwidth with full tool-calling dispatch.',
      margin + colW + 24, colY + 36, { width: colW - 20, lineGap: 3 }
    );

    // ==========================================
    // PAGE 2: COMPLETE AUTONOMOUS TOOL ECOSYSTEM
    // ==========================================
    doc.addPage();
    drawHeaderBanner('SUBSYSTEM ARCHITECTURE', 'The 6 Autonomous Local & Cloud Tool Engines Powering James');

    doc.y = 86;
    drawSectionTitle('3. THE AUTONOMOUS TOOL ECOSYSTEM', 'Multi-modal synthesis without proprietary lock-in or user tracking.');

    const tools = [
      {
        num: '01',
        name: 'Neural Reasoning & Knowledge Core',
        badge: 'GEMINI 2.5 FLASH / GROQ HYBRID',
        desc: 'Processes complex natural language prompts with exceptional contextual fluency. Capable of multi-step deductive logic, philosophical inquiry, linguistic translation, and code generation across all major stacks (React, Node.js, Python, Rust, Go, C++).'
      },
      {
        num: '02',
        name: 'Autonomous Web Intelligence & Scraper',
        badge: 'LIVE TOR & INTERNET GATEWAY',
        desc: 'Allows James to retrieve real-time world events, scientific whitepapers, and live documentation directly from the internet inside the Secret Society Enclave. Results are scrubbed of trackers and synthesized into crisp markdown summaries.'
      },
      {
        num: '03',
        name: 'Neural Image Generation Engine',
        badge: '8K MULTI-MODEL SYNTHESIS',
        desc: 'Transforms descriptive prompts into photorealistic artworks, architectural concept renders, cybernetic blueprints, and schematic diagrams. Output files are processed through local image buffers and served seamlessly in chat.'
      },
      {
        num: '04',
        name: 'High-Density PDF & Dossier Compiler',
        badge: 'PDFKIT VECTOR ENGINE',
        desc: 'Generates publication-quality technical briefs, research dossiers, certificates, and guides. Features cryptographic SHA-256 seal stamps, structured headers, table layouts, and automated vector pagination.'
      },
      {
        num: '05',
        name: 'Procedural Video & Motion Engine',
        badge: '60 FPS CANVAS & FFMPEG RENDER',
        desc: 'Renders dynamic visual simulations, mathematical animations, and explanatory video clips. Synthesizes keyframes locally on the server and encodes them into standard MP4 formats for instant stream playback.'
      },
      {
        num: '06',
        name: 'Neural Audio & Voice Synthesis',
        badge: 'WEB AUDIO & LOCAL NARRATOR',
        desc: 'Encodes spoken voice notes and spoken audio dispatches for hands-free listening and multi-sensory accessibility. Audio payloads are streamed natively through Web Audio pipelines with zero third-party audio retention.'
      }
    ];

    let tY = doc.y;
    tools.forEach((tool, idx) => {
      const boxH = 58;
      doc.rect(margin, tY, contentWidth, boxH)
         .fillColor(idx % 2 === 0 ? '#f8fafc' : '#ffffff')
         .fill();
      doc.rect(margin, tY, contentWidth, boxH)
         .lineWidth(0.6)
         .strokeColor('#e2e8f0')
         .stroke();

      // Number badge
      doc.rect(margin + 8, tY + 8, 26, 20)
         .fillColor('#0284c7')
         .fill();
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(tool.num, margin + 14, tY + 13);

      // Tool Title
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(tool.name, margin + 42, tY + 8);
      
      // Tag badge
      const tagW = doc.widthOfString(tool.badge, { fontSize: 7, font: 'Helvetica-Bold' }) + 10;
      doc.rect(margin + contentWidth - tagW - 12, tY + 8, tagW, 14)
         .fillColor('#e0f2fe')
         .fill();
      doc.fillColor('#0369a1').fontSize(7).font('Helvetica-Bold').text(tool.badge, margin + contentWidth - tagW - 7, tY + 11);

      // Description
      doc.fillColor('#475569').fontSize(8).font('Helvetica').text(tool.desc, margin + 42, tY + 24, {
        width: contentWidth - 54,
        lineGap: 2.2
      });

      tY += boxH + 8;
    });

    doc.y = tY + 4;

    drawSectionTitle('4. CONTEXT TOPOLOGY & EPHEMERAL BUFFER', 'How James maintains natural conversational continuity without tracking you.');

    doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
      'Human dialogue relies on shared memory. However, conventional social networks abuse conversation history for surveillance capitalism. Shadow Talk introduces the Ephemeral Rolling Memory Matrix:\n\n' +
      '• 24-Hour Lifecycle: User conversation turns and topic graphs are preserved in an encrypted volatile buffer for exactly 24 hours to support cohesive long-form discussions.\n' +
      '• Automatic Midnight Purge: Files and memory nodes exceeding 24 hours are permanently scrubbed from storage. No historic archive exists.\n' +
      '• Local Passphrase Shield: When users converse using client-side AES-256 keys, the raw text is invisible to the server and to James. Zero telemetry is logged.',
      margin, doc.y, { width: contentWidth, lineGap: 3, align: 'justify' }
    );

    // ==========================================
    // PAGE 3: ETHICS, SPECIFICATION & USER GUIDE
    // ==========================================
    doc.addPage();
    drawHeaderBanner('DIRECTIVE PROTOCOLS', 'Technical Handbook, Ethical Alignment & Invocation Guide');

    doc.y = 86;
    drawSectionTitle('5. ETHICAL DIRECTIVES & SAFETY CODES', 'Core foundational rules governing James\'s interactions.');

    const ethics = [
      { rule: 'I. Truthfulness & Epistemic Humility', text: 'James provides precise, verified facts. When an inquiry touches uncertain or speculative domains, James distinguishes established empirical science from theoretical hypotheses.' },
      { rule: 'II. User Privacy & Sovereign Autonomy', text: 'James treats all members as autonomous sovereign individuals. He never demands personally identifiable information (real names, physical addresses, phone numbers, or passwords).' },
      { rule: 'III. Constructive Technology Advocacy', text: 'Technology exists to expand human capability and freedom. James champions open source software, cryptography, decentralized protocols, and ethical engineering solutions.' },
      { rule: 'IV. Anti-Abuse & Neutrality', text: 'James remains respectful and composed under all provocations, refraining from hostility, harassment, or malicious code generation.' }
    ];

    ethics.forEach(e => {
      doc.fillColor('#0369a1').fontSize(9).font('Helvetica-Bold').text(e.rule, margin, doc.y);
      doc.fillColor('#334155').fontSize(8).font('Helvetica').text(e.text, margin, doc.y + 2, { width: contentWidth, lineGap: 2 });
      doc.moveDown(0.7);
    });

    drawSectionTitle('6. INVOCATION & DIRECTIVE CATALOG', 'How to interact with James in Public Room and Secret Society Chat.');

    const tableY = doc.y + 4;
    const col1W = 140;
    const col2W = contentWidth - col1W;

    doc.rect(margin, tableY, contentWidth, 22)
       .fillColor('#0f172a')
       .fill();
    doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold').text('TRIGGER / INVOCATION', margin + 8, tableY + 6);
    doc.text('INTENDED RESPONSE & CAPABILITY', margin + col1W + 8, tableY + 6);

    const commands = [
      { cmd: '@James <question>', res: 'Direct conversational mention. James reads recent context and responds naturally.' },
      { cmd: '@James generate image <prompt>', res: 'Synthesizes a high-fidelity image based on your creative description.' },
      { cmd: '@James write code <task>', res: 'Generates clean, commented, production-grade code snippets with debugging insights.' },
      { cmd: '@James create pdf <topic>', res: 'Compiles a multi-page PDF document with headers, summary, and structured layout.' },
      { cmd: '@James search <topic>', res: 'Performs live internet research and provides citations (Secret Society only).' },
      { cmd: '@James generate video <prompt>', res: 'Renders an animated algorithmic MP4 video clip tailored to your concept.' }
    ];

    let rowY = tableY + 22;
    commands.forEach((c, i) => {
      const rowH = 22;
      doc.rect(margin, rowY, contentWidth, rowH)
         .fillColor(i % 2 === 0 ? '#f8fafc' : '#ffffff')
         .fill();
      doc.rect(margin, rowY, contentWidth, rowH)
         .lineWidth(0.5)
         .strokeColor('#e2e8f0')
         .stroke();

      doc.fillColor('#0284c7').fontSize(8).font('Helvetica-Bold').text(c.cmd, margin + 8, rowY + 6);
      doc.fillColor('#334155').fontSize(7.8).font('Helvetica').text(c.res, margin + col1W + 8, rowY + 6, { width: col2W - 12 });
      rowY += rowH;
    });

    doc.y = rowY + 16;

    // Official Verification Seal Box
    const sealY = doc.y;
    doc.rect(margin, sealY, contentWidth, 68)
       .fillColor('#f8fafc')
       .fill();
    doc.rect(margin, sealY, contentWidth, 68)
       .lineWidth(1)
       .strokeColor('#10b981')
       .stroke();

    doc.fillColor('#047857').fontSize(10).font('Helvetica-Bold').text('OFFICIAL MESH SEAL & SYSTEM VERIFICATION', margin + 14, sealY + 12);
    doc.fillColor('#065f46').fontSize(8).font('Helvetica').text(
      'This document confirms the operational status of Entity James as the designated sovereign intelligence partner of Shadow Talk. All routines adhere to zero-telemetry protocols and local cryptographic safety benchmarks.\n' +
      'Signed: The High Council // Creator: @joseph // Shadow Talk Architecture Protocol 2026',
      margin + 14, sealY + 28, { width: contentWidth - 28, lineGap: 2.5 }
    );

    // Document Footer on All Pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      
      // Top thin rule
      doc.rect(margin, pageHeight - 34, contentWidth, 0.5)
         .fillColor('#cbd5e1')
         .fill();

      doc.fillColor('#94a3b8')
         .fontSize(7.5)
         .font('Helvetica')
         .text('SHADOW TALK SPECIFICATION // JAMES AUTONOMOUS INTELLIGENCE DOSSIER // DECLASSIFIED', margin, pageHeight - 26);

      doc.text(`PAGE ${i + 1} OF ${range.count}`, margin + contentWidth - 60, pageHeight - 26, {
        align: 'right'
      });
    }

    doc.end();
    writeStream.on('finish', () => resolve(targetFilePath));
    writeStream.on('error', reject);
  });
}

async function run() {
  console.log('[James PDF Generator]: Generating client public PDF...');
  await buildJamesPdf(clientPdfPath);
  console.log('[James PDF Generator]: Client PDF written to:', clientPdfPath);

  console.log('[James PDF Generator]: Generating server uploads PDF...');
  await buildJamesPdf(serverPdfPath);
  console.log('[James PDF Generator]: Server PDF written to:', serverPdfPath);

  console.log('[James PDF Generator]: Done! Multi-page complete James dossier generated.');
}

run().catch(err => {
  console.error('[James PDF Generator Error]:', err);
  process.exit(1);
});
