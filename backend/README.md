# StudentOS Backend

Node.js + TypeScript backend API for StudentOS Phase 1.

## Tech Stack

- **Framework**: Fastify
- **Database**: Supabase (Postgres + Auth)
- **Queue**: BullMQ + Redis
- **Email APIs**: Gmail API, Microsoft Graph
- **Language**: TypeScript

## Setup

### Prerequisites

- Node.js 18+
- Supabase account
- Redis (for BullMQ)
- Google Cloud Platform account (for Gmail API)

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- `REDIS_URL` - Redis connection URL
- `GOOGLE_CLIENT_ID` - Gmail API OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Gmail API OAuth secret
- `ENCRYPTION_KEY` - 32-byte key for encrypting tokens

### Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the schema migration:

```bash
# Copy the SQL from db/schema.sql and run it in Supabase SQL Editor
# OR use the Supabase CLI:
supabase db push
```

### Development

```bash
npm run dev
```

Server will start at http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Feed
- `GET /api/feed` - Get all candidates and tasks
- `GET /api/feed/new` - Get new candidates to confirm
- `GET /api/feed/upcoming` - Get upcoming tasks

### Candidates
- `POST /api/candidates/:id/confirm` - Confirm candidate → create task
- `POST /api/candidates/:id/edit` - Edit candidate fields
- `POST /api/candidates/:id/ignore` - Ignore candidate
- `GET /api/candidates/:id/source` - View source email snippet

### Integrations
- `POST /api/integrations/gmail/connect` - Start Gmail OAuth
- `POST /api/integrations/gmail/callback` - Gmail OAuth callback
- `GET /api/integrations/status` - Check integration status

### Webhooks
- `POST /webhooks/gmail/pubsub` - Gmail push notifications
- `POST /webhooks/forward/:userId` - Email forwarding ingestion

## Project Structure

```
backend/
├── src/
│   ├── config/        # Environment config
│   ├── lib/           # Supabase, Gmail clients
│   ├── middleware/    # Auth, error handling
│   ├── routes/        # API endpoints
│   ├── services/      # Business logic (parsing, Gmail, etc.)
│   ├── jobs/          # Background jobs (BullMQ)
│   └── server.ts      # Main entry point
├── db/
│   └── schema.sql     # Database schema
└── package.json
```

## Next Steps

- [ ] Implement Gmail OAuth flow
- [ ] Build parsing service (email → task candidates)
- [ ] Set up BullMQ jobs
- [ ] Add tests
