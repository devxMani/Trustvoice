# TrustVoice

> A pixel-art multiplayer world exclusively for voice-AI founders — with Stripe revenue verification, spatial audio via LiveKit, and tier-locked zones.

![TrustVoice Screenshot](docs/screenshot.png)

## 🎮 What is this?

TrustVoice is a Habbo/Gather.town-style pixel world where **every player's position on the map reflects their verified monthly revenue**. Connect Stripe, verify your MRR, and unlock new zones. Walk up to other founders and start a spatial voice call.

### Tiers
| Emoji | Tier | Revenue | Zone |
|-------|------|---------|------|
| 🌱 | Free | < $1K/mo | Starter Village |
| 🤖 | Starter | $1K–$5K/mo | Growth Park |
| 🚀 | Growth | $5K–$20K/mo | Scale District |
| 👑 | Scale | $20K+/mo | Whale Lounge |

---

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript (strict)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL via Prisma
- **Auth**: NextAuth.js v5 (Google, GitHub, Magic Link)
- **Revenue Verification**: Stripe (API key or Connect OAuth) — server-side only
- **Spatial Voice**: LiveKit Cloud (React SDK)
- **Pixel Game Engine**: Phaser 3 (dynamic import, client-only)
- **State**: Zustand / component state + LiveKit data channels for multiplayer sync
- **Deployment**: Vercel + LiveKit Cloud

---

## ⚙️ Setup

### 1. Clone & install

```bash
git clone https://github.com/your/trustvoice
cd trustvoice
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

```env
# Database (PostgreSQL via Supabase, Railway, Neon, etc.)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# OAuth providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Magic link email (Resend)
AUTH_RESEND_KEY=""
EMAIL_FROM="noreply@yourdomain.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_CLIENT_ID="ca_..."          # For Connect OAuth (optional)
STRIPE_WEBHOOK_SECRET="whsec_..."

# LiveKit
LIVEKIT_API_KEY=""
LIVEKIT_API_SECRET=""
LIVEKIT_URL="wss://your-project.livekit.cloud"
```

### 3. Database setup

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
/app
  /                   → Landing page
  /login              → Auth (Google, GitHub, Magic Link)
  /dashboard          → Profile + Stripe verification
  /world              → Main Phaser game + LiveKit
  /api
    /auth/[...nextauth]
    /stripe/verify    → Revenue verification (server-side)
    /stripe/callback  → Stripe Connect OAuth callback
    /stripe/webhook   → Stripe webhooks for auto re-verify
    /livekit/token    → LiveKit JWT token generator
    /player/position  → Position persistence

/components
  /game
    PhaserGame.tsx    → React wrapper for Phaser (dynamic import)
  /voice
    SpatialAudio.tsx  → Distance-based volume adjustment
    VoiceControls.tsx → Mute/unmute/leave UI
  /ui
    TierBadge.tsx     → Revenue tier pill badge
    PlayerCard.tsx    → Player profile popup
    GameSidebar.tsx   → Online players, chat, settings

/lib
  auth.ts             → NextAuth config
  prisma.ts           → Prisma singleton
  stripe.ts           → Server-only Stripe client + verification
  livekit.ts          → Server-only LiveKit token generation
  tiers.ts            → Tier thresholds, metadata, helpers
  utils.ts            → Shared utils (spatial volume, lerp, etc.)
  /phaser
    AssetLoader.ts    → Programmatic pixel-art texture generation
    MapGenerator.ts   → World map layout (zones, buildings, paths)
    /scenes
      BootScene.ts    → Preload + asset generation
      WorldScene.ts   → Main game: tilemap, players, movement
```

---

## 🔒 Security Notes

- **Revenue is verified server-side only** — the client never knows about API keys
- **LiveKit tokens are generated server-side** with user metadata injected
- **Tier is never trusted from the client** — always read from DB
- Stripe API keys are used transiently and should be restricted to read-only Charges

---

## 🎨 Pixel Art Assets

All sprites are generated programmatically via Phaser's Graphics API in `AssetLoader.ts` — no external image files needed for the MVP. To upgrade to real pixel art:

1. Drop sprites into `/public/assets/characters/`, `/public/assets/tiles/`, etc.
2. Load them in `BootScene.preload()` with `this.load.spritesheet()`
3. Replace the `generateTextures()` call

Recommended free asset packs:
- [LPC Sprite Sheet Character Generator](https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/)
- [Kenney.nl Tiny Town](https://kenney.nl/assets/tiny-town)
- [Tiny RPG Forest](https://bakudas.itch.io/tiny-rpg-forest)

---

## 🗺️ Map Layout

The world is **3200 × 2560 pixels** (100 × 80 tiles at 32px each), divided into 4 quadrants:

```
┌─────────────────────┬─────────────────────┐
│   Starter Village   │    Growth Park       │
│   (FREE tier)       │    ($1K–$5K/mo)      │
│   tiles [0,0]       │    tiles [50,0]      │
├─────────────────────┼─────────────────────┤
│   Scale District    │    Whale Lounge      │
│   ($5K–$20K/mo)     │    ($20K+/mo)        │
│   tiles [0,40]      │    tiles [50,40]     │
└─────────────────────┴─────────────────────┘
```

---

## 🌐 Deployment

### Vercel

```bash
npm run build
vercel deploy
```

Set all env vars in Vercel dashboard.

### Stripe Webhook

Point `https://yourdomain.com/api/stripe/webhook` in Stripe Dashboard with events:
- `charge.succeeded`
- `payment_intent.succeeded`
- `invoice.payment_succeeded`
- `account.updated`

### LiveKit

Sign up at [livekit.io](https://livekit.io) and get your API key, secret, and URL.

---

## 📅 Features & Roadmap

- [x] Character customization UI (Founder Studio: skin, hair, outfit palette, companion pets)
- [x] "Demo my Agent" live tester (live webhook proxy to Vapi/Bland + speech synthesis fallback)
- [x] Zone-specific building rooms (enter buildings → dedicated room audio channels)
- [x] Daily revenue re-verification Cron (`/api/cron/reverify` for automated updates)
- [x] Founders Hall of Fame Leaderboard (`/api/leaderboard` with MRR rankings & tier filtering)
- [x] Retro Minimap Radar HUD (live player beacons & locked zone indicators)
- [x] Mobile touch controls with virtual directional pad
- [ ] LPC external spritesheet loader (optional expansion pack)
- [ ] Native mobile app wrapper (Capacitor/PWA)

---

Built with ❤️ for the voice-AI founder community.
