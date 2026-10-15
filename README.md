# ⚡ ShadowTalk — Sovereign Encrypted Mesh Sanctuary & Autonomous Intelligence Enclave

<div align="center">

![License](https://img.shields.io/badge/License-MIT-00f3ff?style=for-the-badge)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![NodeJS](https://img.shields.io/badge/Node.js_20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)
![Security](https://img.shields.io/badge/OWASP_Hardened-10b981?style=for-the-badge&logo=shield&logoColor=white)

**A next-generation sovereign communication platform engineered for high-security ephemeral mesh messaging, autonomous community intelligence, clandestine enclave operations, and hardened multi-factor root administration.**

[Key Features](#-core-capabilities) • [Architecture](#-system-architecture) • [Security Hardening](#-20-point-security-hardening) • [Quick Start](#-quick-start-guide) • [Environment Setup](#-environment-configuration)

</div>

---

## 🌌 Overview

**ShadowTalk** is an encrypted, zero-surveillance communications ecosystem designed for sovereign users. Built with a cyberpunk aesthetic and mathematical opsec principles, it seamlessly merges high-speed ephemeral public chat with a subterranean Secret Society enclave, an autonomous 24/7 AI archivist (**James**), and an interactive 3D WebGL orbital globe tracking encrypted telemetry in real time.

---

## ✨ Core Capabilities

### 💬 1. Ephemeral Quantum Mesh Communications
- **Zero Data Retention:** Automatic 24-hour message purge and media shredding.
- **Rich Media & Audio:** Real-time voice note recordings, audio waveforms, file attachments, and swipe-to-reply mechanics.
- **Identity Attestation:** 20 distinct high-resolution avatars, customizable bios, custom color signatures, and optional 4-digit cryptographic email OTP profile verification with the official **Verified Blue Tick** badge.
- **Interactive Micro-Polls:** Community voting polls created directly by users or autonomously spawned by James Bot.

### 🤖 2. James — Autonomous Community Intelligence Agent
- **24/7 Autonomous Presence:** Persistent AI community member operating with autonomous decision engines, memory service, and topic tracking.
- **Multi-Model Provider Architecture:** Compatible with OpenRouter, DeepSeek V4 Flash, Google Gemini 2.5, OpenAI GPT-4o-mini, and local Ollama nodes.
- **Autonomous News & Trends Broadcasts:** Autonomous real-time dispatch of breaking world news, viral technology updates, cybersecurity bulletins, and science discoveries.
- **Classified PDF Intelligence Dossier:** Generates official cryptographic intelligence dossiers utilizing high-council watermarks, cryptographic hashes, and interactive PDF viewers.

### 👁️ 3. The Secret Society & Enclave Sanctum
- **Clandestine Subterranean Room:** Isolated encrypted enclave accessible only through vetted passphrase attestation or high-council candidate approval.
- **Tor Darknet & Onion Gateway Proxy:** Internal sandboxed proxy engine that resolves, sanitizes, and renders `.onion` hidden services with automated XSS and script quarantine.
- **Encrypted Socratic Council Debates:** High-level philosophical and geopolitical intelligence exchanges mediated by James Enclave Archivist.
- **Air-Gapped Telemetry Feed:** Real-time monitor of planetary node health, hash rates, and latency.

### 🌍 4. 3D Planetary Visitor Telemetry (Globe.GL / Three.js)
- **Live 3D Globe Visualization:** Interactive WebGL globe rendering worldwide encrypted visitor nodes.
- **Visual Stalk Pointers & Arcs:** Dynamic 3D stalk pins with glowing pulse ripples and trajectory arcs connecting mesh nodes.
- **Spiderfy Multi-User Fan-Out:** Automatic coordinate clustering preventing pin overlap in dense geographic regions.
- **Worldwide Deep Zoom:** Smooth zoom transitions streaming map tiles down to city and street level.

### 👑 5. Hidden Multi-Factor Root Command Mainframe
- **Zero-Surface Admin Discovery:** Public access attempts to `/admin` return standard 404 Not Found responses.
- **Multi-Layer Cryptographic Progression:**
  1. *Secret UI Gesture Trigger:* Multi-touch sequence on the client canvas.
  2. *Secret Voice Phrase Attestation:* Voice recognition audio phase matching server-side secret phrases.
  3. *Secret Root Terminal Override:* Private socket challenge directly to `system_root`.
- **Live Mission Control:** Real-time visitor map, message purge triggers, candidate application vetting, maintenance toggle, and telemetry stream.

---

## 🛡️ 20-Point Security Hardening

ShadowTalk has undergone a comprehensive, point-by-point defensive security audit aligned with **OWASP Top 10** standards:

| Security Vector | Defense Implementation |
|---|---|
| **API Key Isolation** | All external AI and SMTP credentials isolated server-side. Zero frontend token leakage. |
| **Masked Identity Data** | Public `/api/otp/status` returns masked email identifiers (`mn***@gmail.com`). |
| **SSRF Defense Guard** | Outbound proxy engine validates IP destinations via DNS resolution; strictly blocks `127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`, and cloud metadata (`169.254.169.254`). |
| **In-Memory Rate Limiting** | Sliding-window limiters protect global APIs (300/min), OTP requests (5/10min), file uploads (20/10min), and auth attempts (10/10min). |
| **CORS Whitelist Isolation** | Eliminated wildcard reflection with credentials; enforced strict origin whitelist. |
| **HTTP Security Headers** | Injected `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy`, and `Strict-Transport-Security`. |
| **XSS Defense & Sanitization** | Client-side `DOMParser` HTML sanitizer purges `<script>`, `<iframe>`, `<object>`, inline event handlers (`on*`), and dangerous URI schemes. |
| **Input & Form Sanitization** | Deep JSON/form inspection stripping null bytes (`\0`) and prototype pollution vectors (`__proto__`, `constructor`). |
| **Timing-Safe Cryptography** | Secret comparison and password checks use SHA-256 and constant-time `crypto.timingSafeEqual`. |
| **Upload File Quarantine** | Rejects dangerous executable/script extensions (`.exe`, `.bat`, `.php`, `.sh`, `.js`). Static files served with `Content-Disposition: attachment` for HTML/SVG. |
| **DoS & Scale Protection** | Max message queue buffer capped to 1,000 items in memory/disk. Global JSON parser limit restricted to 2MB. |
| **IP Spoofing Immunity** | Removed trust in forged `X-Forwarded-For: 127.0.0.1` headers for administrative clearance endpoints. |

---
## 📜 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Architected with Sovereignty & Cryptographic Precision by Joseph **

*Encrypted transmissions. Sovereign identities. Zero footprints.*

</div>
