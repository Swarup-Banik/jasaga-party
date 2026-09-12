# 🍿 JASAGA PARTY — Collaborative Watch Party & Virtual Cloud Browser

A modern, high-performance collaborative Watch Party web application built with **Next.js (App Router)**, **Tailwind CSS**, and **TypeScript**.

Featuring a **75% / 25% dark cinema theater layout**, embedded interactive virtual browsing powered by the **Hyperbeam Web SDK**, and real-time chat with online viewer presence and floating emoji reaction bursts powered by **Supabase Realtime**.

---

## ✨ Features

- 🌐 **Room Management**:
  - Create custom party rooms with friendly codes (e.g. `cyber-cinema-402`).
  - Shareable 1-click invite link: friends can join immediately without logging in.
  - Join by room code or full URL.
- 🖥️ **Virtual Browser (75% Viewport)**:
  - Powered by Hyperbeam Web SDK (`@hyperbeam/web`).
  - Stream videos (YouTube, Twitch, Netflix, anime, etc.) or browse any website interactively together.
  - Shared audio with volume control & automatic browser autoplay unmute prompt.
  - Fullscreen theater mode & reload controls.
  - **Collaborative Control**: Users can toggle and pass browser mouse & keyboard control.
  - **Zero-friction Demo Mode**: Runs right away with an interactive simulation even before entering API keys!
- 💬 **Real-time Chat (25% Sidebar)**:
  - Real-time messaging with timestamps and sender badges.
  - Supabase Realtime broadcast channels with fallback to multi-tab `BroadcastChannel`.
  - Live viewer presence tracking (online member counter & avatar list).
  - Floating emoji reactions: clicking reactions like 🍿, 🔥, ❤️, 😂 triggers floating animated emoji bursts on all viewers' video screens!
  - Mini emoji drawer for inserting emojis into messages.
- 🎨 **Dark Theater UI/UX**:
  - Deep obsidian & neon palette tailored for night-time viewing.
  - Fully responsive: smooth 75%/25% split on desktop, and collapsible slide-over chat drawer on mobile & tablet screens.
  - Custom identity builder: pick your party nickname, avatar icon, and aura gradient.

---

## 🚀 Quick Start

### 1. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Connecting API Keys

JASAGA PARTY is configured with a built-in **Interactive Sandbox Demo** so you can test and explore immediately. When you are ready for dedicated cloud virtual machines and global multi-device sync, add your API keys to `.env.local`:

### 1. Hyperbeam API Key (Virtual Cloud Browser)
1. Go to [hyperbeam.com](https://hyperbeam.com) and create a free account.
2. Open your Developer Dashboard and generate an **API Key**.
3. Add it to `.env.local`:
   ```env
   HYPERBEAM_API_KEY=hb_live_...
   ```
4. Restart your Next.js server. Hyperbeam will now allocate real Chromium cloud virtual machines for every room!

### 2. Supabase Realtime (Real-time Chat & Presence)
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Go to **Project Settings** → **API**.
3. Copy your Project URL and anon public key into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. Real-time broadcast and presence will now instantly sync across any browser, phone, or laptop worldwide!

---

## 🚢 Production Deployment

### Framework & Build Specifications
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript, Tailwind CSS)
- **Node.js Target**: `18.17+` or `20+` (tested on Node 20 & 22)
- **Build Command**: `npm run build` (or `next build`)
- **Start Command**: `npm start` (or `next start`)
- **Package Manager**: `npm` (also supports `yarn`, `pnpm`, or `bun`)

### Production Environment Variables
Configure the following in your hosting provider's Environment Variables dashboard (e.g. Vercel, Railway, Netlify, Render):

| Variable | Scope | Required | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client | Yes | Supabase Project URL (`https://<project>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client | Yes | Supabase Publishable / Anon key (`sb_publishable_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only (Secret)** | Optional | Supabase Service Role key (`sb_secret_...`). **NEVER prefix with `NEXT_PUBLIC_`** |
| `HYPERBEAM_API_KEY` | **Server-Only (Secret)** | Yes | Hyperbeam Cloud VM API Key (`sk_test_...` or `hb_live_...`). **NEVER prefix with `NEXT_PUBLIC_`** |
| `NEXT_PUBLIC_DEFAULT_START_URL` | Public / Client | Optional | Default URL opened when a room is created (e.g. `https://www.youtube.com`) |

### Deploying to Vercel (Recommended)
1. Push your repository to GitHub / GitLab / Bitbucket.
2. Go to [Vercel](https://vercel.com/new) and import the repository.
3. In **Environment Variables**, add the keys from the table above.
4. Framework Preset will automatically detect **Next.js**.
5. Click **Deploy**.

### Deploying with Docker / Self-Hosted Node.js
```bash
# 1. Install dependencies
npm ci

# 2. Compile production build
npm run build

# 3. Start high-performance production server
NODE_ENV=production PORT=3000 npm start
```

---

## 🔒 Security Architecture
- **Secret Isolation**: `HYPERBEAM_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are only ever accessed on the server (in `/api/hyperbeam/session` and `getSupabaseAdminClient`).
- **No Client Exposure**: Client-side JavaScript bundles generated during `npm run build` are audited and contain zero secret keys.
- **Git Protection**: `.gitignore` strictly ignores all `.env`, `.env*.local`, and `.env.production` files.

```
Stream.agy/
├── src/
│   ├── app/
│   │   ├── api/hyperbeam/session/   # Server route requesting Hyperbeam VM sessions
│   │   ├── room/[roomId]/           # 75% video / 25% chat theater screen
│   │   ├── layout.tsx               # Root dark theme layout
│   │   ├── page.tsx                 # Lobby with Room creation & joining
│   │   └── globals.css              # Cinema styling & custom scrollbars
│   ├── components/
│   │   ├── theater/
│   │   │   ├── HyperbeamPlayer.tsx  # @hyperbeam/web SDK mounting & controls
│   │   │   ├── PlayerControls.tsx   # Fullscreen, audio, reload, take control
│   │   │   ├── TheaterHeader.tsx    # Room info, invite link, viewer counter
│   │   │   └── FloatingReactions.tsx# Floating emoji particles animation
│   │   ├── chat/
│   │   │   ├── ChatSidebar.tsx      # Sidebar container & tabs
│   │   │   ├── ChatMessageList.tsx  # Auto-scrolling messages feed
│   │   │   ├── ChatMessageItem.tsx  # Single message bubbles
│   │   │   ├── ChatInput.tsx        # Input field with emoji picker
│   │   │   ├── EmojiPickerBar.tsx   # Floating burst reaction pills
│   │   │   └── MemberListTab.tsx    # Live presence viewers tab
│   │   └── lobby/
│   │       ├── CreateRoomCard.tsx   # Room generator with source presets
│   │       ├── JoinRoomCard.tsx     # Enter room code or full invite URL
│   │       └── UserProfileModal.tsx # Customize nickname, avatar & aura
│   ├── hooks/
│   │   ├── useSupabaseChat.ts       # Supabase Realtime + BroadcastChannel fallback
│   │   └── useRoomUser.ts           # Local user identity in localStorage
│   ├── lib/
│   │   ├── hyperbeam.ts             # Server Hyperbeam API caller & session cache
│   │   ├── supabase.ts              # Supabase client singleton
│   │   └── utils.ts                 # Room generator, colors, formatters
│   └── types/                       # TypeScript interfaces for chat, room, hyperbeam
├── package.json
└── tailwind.config.ts
```
