# ⚡ ShadowTalk — Private & Sovereign Encrypted Communication Platform

<div align="center">

![License](https://img.shields.io/badge/License-MIT-00f3ff?style=for-the-badge)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![NodeJS](https://img.shields.io/badge/Node.js_20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

**A fast, private, and modern real-time messaging platform designed for secure and sovereign conversations with zero tracking and automated data cleanup.**

[About ShadowTalk](#-about-shadowtalk) • [What It's For](#-what-it-is-for) • [Key Features](#-key-features) • [Mobile App](#-mobile-app-android-apk) • [Quick Start](#-quick-start)

</div>

---

## 🌐 About ShadowTalk

**ShadowTalk** is a privacy-first web application designed for people who value direct, unmonitored communication. Traditional messaging platforms often collect personal metadata, store message histories indefinitely, and monetize user interactions. 

ShadowTalk provides an alternative: a clean, responsive space where you can communicate in real time with an end-to-end focus on user sovereignty, minimal data retention, and seamless performance across all desktop and mobile browsers.

---

## 🎯 What It Is For

- **Ephemeral Private Conversations:** Real-time discussions with friends, collaborators, and communities where conversations naturally expire after 24 hours.
- **Audio & Media Sharing:** High-clarity voice messages, file attachments, and photo sharing without quality loss.
- **Fast Community Interaction:** Instant messaging, message replies, interactive reactions, and community polls.
- **Autonomous AI Assistance:** Chatting and brainstorming with **James**, an intelligent community assistant who answers questions and shares trending topics.
- **Cross-Platform Access:** Accessible directly in any modern web browser or through the dedicated standalone Android application.

---

## ✨ Key Features

- **⚡ Instant Real-Time Messaging:** Powered by WebSocket technology for sub-millisecond message delivery and typing indicators.
- **🎙️ Real-Time Voice Notes:** Record and send audio messages with animated waveforms and playback controls.
- **📎 File & Media Attachments:** Share documents, screenshots, and media files directly in conversations.
- **👤 Customizable Identities:** Choose from 20 unique preset avatars, select your signature message color, and personalize your profile bio.
- **🛡️ Minimal Data Footprint:** Automated 24-hour cleanup routines ensure old messages and attachments are automatically cleared.
- **🤖 James — AI Community Companion:** An integrated AI companion that converses with users, answers questions, and facilitates interactive group polls.
- **📜 Sovereign Manifesto:** An interactive manifesto outlining privacy, free communication principles, and technical whitepapers.

---

## 📱 Mobile App (Android APK)

ShadowTalk is also available as a standalone Android app so you don't need to open your browser every time:

- **1-Tap Direct Launch:** Instant access from your Android home screen.
- **Full Feature Parity:** Voice notes, media uploads, and real-time messaging.
- **Direct Download:** Download the APK directly from the website's Manifesto page or install it locally.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [npm](https://www.npmjs.com/) v9.0.0 or higher

### 1. Clone the Repository
```bash
git clone https://github.com/JOSEPHYT7/shadow-talk.git
cd shadow-talk
```

### 2. Configure Environment
Create a `.env` file in the `server/` directory:
```bash
cp server/.env.example server/.env
```

Add your basic configuration:
```env
PORT=5000
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_app_password
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key_here
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 4. Run the Application
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```

Visit **http://localhost:5173** in your browser to start using ShadowTalk!

---

## 📜 License

This project is licensed under the **MIT License**.

<div align="center">

**ShadowTalk — Real-time. Private. Sovereign.**

</div>
