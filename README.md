# DRIFT — Production-Ready Dating App

> Stop swiping. Start drifting.

DRIFT is a live-feed based dating/connection app where matches are based on **shared likes AND shared dislikes**. No swipe mechanics. Real compatibility. 24-hour match windows.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS (dark theme) |
| Auth | NextAuth.js v4 (JWT + credentials) |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Socket.io (custom server) |
| State | TanStack Query v5 |
| Validation | Zod |

---

## Quick Start

### 1. Clone and install
```bash
cd drift
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET
```

### 3. Set up database
```bash
# Create a PostgreSQL database, then:
npx prisma db push
npm run db:seed  # Optional: add demo data
```

### 4. Run the app
```bash
npm run dev
# Open http://localhost:3000
```

### Demo login (after seeding)
- **Email:** `alex@drift.app`
- **Password:** `password123`

---

## Project Structure

```
drift/
├── server.ts              # Custom Node.js server with Socket.io
├── prisma/
│   ├── schema.prisma      # Full database schema
│   └── seed.ts            # Sample data
└── src/
    ├── app/
    │   ├── (auth)/        # Login + Register pages
    │   ├── (main)/        # Protected app pages
    │   │   ├── feed/      # The Drift Feed
    │   │   ├── matches/   # Active matches
    │   │   ├── chat/      # Real-time chat
    │   │   └── profile/   # User profile
    │   ├── api/           # All API routes
    │   └── onboarding/    # 5-step onboarding flow
    ├── components/
    │   ├── feed/          # DriftFeed, DriftCard, CreateDriftPost
    │   ├── matches/       # MatchesList
    │   ├── chat/          # ChatWindow, MessageBubble
    │   ├── onboarding/    # OnboardingFlow
    │   ├── layout/        # Navbar, MobileNav
    │   └── ui/            # Button, Input, Badge, Avatar, TagInput, Modal
    ├── hooks/
    │   ├── useSocket.ts   # Socket.io connection
    │   ├── useDriftFeed.ts # Real-time feed updates
    │   └── useMatches.ts  # Real-time match updates
    ├── lib/
    │   ├── auth.ts        # NextAuth config
    │   ├── matching.ts    # Compatibility algorithm
    │   ├── prisma.ts      # Prisma client singleton
    │   ├── socket.ts      # Socket.io helpers
    │   └── utils.ts       # Utilities
    ├── types/index.ts     # All TypeScript types
    └── middleware.ts      # Auth + redirect middleware
```

---

## The Matching Algorithm

```typescript
// A match is ONLY created when:
// 1. Both users have interacted with each other's drift posts
// 2. They share >= 1 common LIKE
// 3. They share >= 1 common DISLIKE

// Scoring:
// +1 per shared like
// +3 per shared dislike  ← weighted higher (rare, more meaningful)
// +2 per shared hobby
// +1 per shared interest
```

### Feed Scoring
Posts are ranked by: `compatibilityScore × 4 + recencyScore + proximityScore`

---

## Database Schema

- **User** — profile, location, auth
- **UserPreferences** — likes, dislikes, hobbies, interests (string arrays)
- **DriftPost** — live activity posts (auto-expire in 24h)
- **Interaction** — like/respond actions on posts
- **Match** — eligible pairs (unique constraint, 24h expiry)
- **Message** — chat messages (cascade delete with match)

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/[...nextauth]` | NextAuth handler |
| GET/PATCH | `/api/users/me` | Get/update profile |
| POST | `/api/onboarding` | Complete onboarding |
| GET | `/api/feed` | Get compatibility-scored feed |
| GET/POST | `/api/drift-posts` | List own / create post |
| DELETE | `/api/drift-posts/[id]` | Delete own post |
| POST | `/api/drift-posts/[id]/interact` | Like or respond (triggers match check) |
| GET | `/api/matches` | List active matches |
| GET | `/api/matches/[id]` | Get single match |
| GET/POST | `/api/messages/[matchId]` | Get/send messages |

---

## Deployment

### Option A — Vercel (Recommended)
> Note: Vercel doesn't support persistent WebSocket connections. For production, replace Socket.io with **Pusher** or **Ably**.

```bash
vercel deploy
# Set env vars in Vercel dashboard
```

### Option B — Railway / Render / Fly.io
These support persistent Node.js servers (Socket.io works natively).

```bash
# Set up a PostgreSQL database (Railway has built-in Postgres)
# Deploy the Node.js app with:
npm run build && npm run start
```

### Required Environment Variables
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
PORT=3000
```

---

## The Drift Effect Philosophy

1. **No swiping** — You see a live feed of what people are doing right now
2. **Mutual interaction triggers match evaluation** — Both must engage
3. **Shared dislikes > shared likes** — Weighted 3x in scoring
4. **24-hour match window** — Creates genuine urgency, not anxiety
5. **Chat disappears after expiry** — Encourages real-world action

---

*Built with care. No algorithms farming your attention.*
