# 🦁 ROAR — Dream11 Live Room

> **Every ball is a story. Every fan has a reaction. ROAR captures the roar.**

A real-time, live matchday companion app designed for high-stakes cricket thrillers (built on the legendary IPL 2019 Final: MI vs CSK). ROAR tracks match tension ball-by-ball, arms an on-device camera buffer during last-over climaxes, saves your authentic reaction, generates culturally authentic Hinglish captions and rival roasts, and streams live banter across the stadium and the collective fan wall.

---

## ⚡ What Makes ROAR Different?

Most sports apps treat fans as passive viewers looking at a cold scoreboard. Cricket in India isn't watched silently — it is felt. When MS Dhoni is run out, or when Lasith Malinga delivers a slower ball on 19.6 to win the IPL by 1 run, fans scream, jump, celebrate, or hold their heads in disbelief.

**ROAR turns those transient emotions into lasting, shareable memories:**
1. **AI Tension Engine (0–100):** Continuously calculates chase pressure, required run rate, and wicket leverage. When tension crosses **80**, the on-device front camera quietly arms an 8-second rolling video buffer (`-4s` before ball to `+4s` after).
2. **Climax ROAR Drop (5-Frame Selector):** On high-tension deliveries (wickets, sixes, last-ball finishes), the app triggers haptic vibrations and presents 5 key frames (`-4s`, `-2s`, `0s`, `+1s`, `+3s`) with an AI-highlighted peak expression.
3. **Multilingual AI Commentary & Roasts:** Converts the moment into culturally authentic captions across **Hinglish**, **English**, and **मराठी**, alongside customizable rival roasts across 3 spice levels (**Mild**, **Spicy**, **Savage**).
4. **Live Banter Rooms (WebSockets):** Real-time rivalry chat room where MI and CSK fans exchange roasts that pop up live across all screens.
5. **9-Fan Collective Reaction Wall:** A live 3x3 mosaic of real fan reactions reacting to the exact same over, powered by a hybrid leaderboard formula:  
   $$\text{Score} = 70\% \text{ Community Votes} + 30\% \text{ AI Hype Score}$$
6. **Zero-Downtime Offline-First Architecture:** Keeps local AsyncStorage as the immediate source of truth, quietly background-syncing to MongoDB Atlas with an automatic in-memory fallback.

---

## 🏗️ Architecture & System Design

```
                     ┌──────────────────────────────────────────┐
                     │          ROAR Mobile (Expo / RN)         │
                     │  • State: Zustand + AsyncStorage         │
                     │  • Camera: Expo Camera (8s buffer)       │
                     │  • Visuals: Barlow Dark Stadium Theme    │
                     └────────────────────┬─────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
         [REST API: 8787]                                [WebSocket: 8787]
      • PUT  /fans/:fanId                              • ws://localhost:8787
      • PUT  /memories/:memoryId                       • Room Join & Presence
      • POST /photos (GridFS)                          • Live Rivalry Roasts
      • GET  /wall & POST /vote                        • Chat History Replay
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          ▼
                      ┌───────────────────────────────────────┐
                      │        Node.js Backend Server         │
                      │  • Automatic .env configuration       │
                      │  • MongoDB Atlas Cloud Store          │
                      │  • Zero-Downtime In-Memory Fallback   │
                      └───────────────────────────────────────┘
```

---

## 📱 The 5 Core Screens

| Screen | Name | Description |
|---|---|---|
| **1** | **Home / Identity Launcher** | Choose your army (MI Paltan or CSK Yellow Army), view matches lived counter, and inspect the matchday card. |
| **2** | **Live Match & Tension Engine** | Ball-by-ball replay with sticky score bar, 1x/2x/4x speed controls, live AI Tension Meter, and Army Bar. |
| **3** | **ROAR Drop Frame Picker** | Scrub 5 reaction frames around the climax delivery (`-4s` to `+3s`) and select your peak expression. |
| **4** | **Reaction Memory Card** | 1080p shareable card with Hinglish captions, rival roast engine (Mild/Spicy/Savage), and one-tap WhatsApp share. |
| **5** | **Collective Reaction Wall** | 9-fan live mosaic with interactive upvoting, "Reaction of the Match" podium, and instant sync. |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v20+)
- npm or yarn
- Expo Go app on iOS/Android (or run in Web/Simulator)

### 1. Start the Backend Server
```bash
cd liveroom
npm run server
```
Server runs on `http://localhost:8787`. Health check: `http://localhost:8787/health`.

### 2. Start the Frontend App
```bash
cd liveroom
npx expo start
```
- Press `w` to open in your web browser.
- Scan the QR code with **Expo Go** on your phone to run on a physical device with front-camera reaction capture!

### 3. Go live with a friend anywhere
See [DEPLOY.md](DEPLOY.md): MongoDB Atlas access, the Render server, and the Netlify server address.

---

## 🛠️ Tech Stack

- **Frontend:** React Native (Expo SDK 58), Expo Router, TypeScript, Zustand, Reanimated, View Shot
- **Backend:** Node.js, Express, WebSocket (`ws`)
- **Database:** MongoDB Atlas, GridFS Bucket (with automatic in-memory fallback)
- **Design System:** Custom Barlow Condensed typography, Stadium Dark palette (`#0A0A0C`, `#FFE14D`, `#FF5A36`, `#2D7FF9`)

---

## 📄 License
MIT License. Built with passion for cricket fans worldwide.
