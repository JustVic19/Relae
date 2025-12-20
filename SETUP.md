# StudentOS Setup Guide

This guide will help you set up StudentOS for local development.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (free tier works)
- Google Cloud Platform account (for Gmail API)
- iOS Simulator (Xcode) or Android Emulator

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/JustVic19/StudentOS.git
cd StudentOS
```

### 2. Set Up Supabase

1. **Create a new Supabase project**: https://supabase.com/dashboard

2. **Get your project credentials**:
   - Go to Project Settings → API
   - Copy the `URL` and `anon/public` key
   - Copy the `service_role` key (keep this secret!)

3. **Run the database schema**:
   - Open the SQL Editor in Supabase
   - Copy the contents of `backend/db/schema.sql`
   - Paste and run it in the SQL Editor
   - This creates all tables, indexes, and RLS policies

### 3. Set Up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# For now, use a local Redis or skip BullMQ setup
REDIS_URL=redis://localhost:6379

# Generate a random 32-byte key:
# openssl rand -base64 32
ENCRYPTION_KEY=your-generated-key-here

# Gmail API (we'll set this up later)
GOOGLE_CLIENT_ID=placeholder
GOOGLE_CLIENT_SECRET=placeholder
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/gmail/callback
```

**Start the backend**:

```bash
npm run dev
```

The server should start at `http://localhost:3000`. Test it:

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 4. Set Up the Mobile App

```bash
cd ../mobile
npm install
npx expo start
```

Options:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

The app will load with mock data. You should see:
- Action Feed with sample tasks
- Confirm/Edit/Ignore buttons working
- Light/Dark mode toggle (moon/sun icon)

## Next Steps

### Set Up Gmail API (Required for Phase 1)

1. **Create a GCP project**: https://console.cloud.google.com
2. **Enable Gmail API**:
   - Go to APIs & Services → Library
   - Search for "Gmail API" and enable it
3. **Create OAuth credentials**:
   - Go to APIs & Services → Credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized redirect URI: `http://localhost:3000/api/integrations/gmail/callback`
   - Copy the Client ID and Client Secret
4. **Update `.env`**:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### Optional: Set Up Redis (for background jobs)

**macOS**:
```bash
brew install redis
brew services start redis
```

**Linux/WSL**:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker**:
```bash
docker run -d -p 6379:6379 redis:alpine
```

## Development Workflow

### Backend
```bash
cd backend
npm run dev  # Watch mode with hot reload
```

### Mobile
```bash
cd mobile
npx expo start
```

Press `r` to reload the app after changes.

### Database Changes

If you modify the schema:
1. Update `backend/db/schema.sql`
2. Run it in Supabase SQL Editor
3. Test locally
4. Commit changes

## Testing

### Test the Feed Endpoint

```bash
# This requires a valid Supabase auth token
# We'll add proper authentication testing soon
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/feed
```

## Common Issues

### "Cannot connect to Supabase"
- Check your `SUPABASE_URL` and keys in `.env`
- Verify the Supabase project is active

### "Redis connection failed"
- If you're not using background jobs yet, this is fine
- Start Redis or comment out BullMQ setup temporarily

### "Expo app crashes on startup"
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Expo cache: `npx expo start -c`

## Project Status

✅ Backend API server (Fastify + TypeScript)  
✅ Database schema (Supabase + RLS)  
✅ Mobile app prototype (Expo + React Native)  
✅ Brutalist design system  
🔜 Gmail OAuth integration  
🔜 Email parsing pipeline  
🔜 Background jobs

**Pilot Launch**: January 12, 2025

---

Need help? Check the READMEs in `/backend` and `/mobile` for more details.
