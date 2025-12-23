# Mobile App Setup Guide

Follow these steps to complete the mobile app integration with Supabase and the backend API.

## Prerequisites

- ✅ Backend services implemented
- ✅ Supabase account created (see main setup guide)
- ✅ Backend server running (`npm run dev` in backend folder)

## Step 1: Create Environment File

Copy the example environment file and fill in your actual values:

```bash
cd mobile
cp .env.example .env
```

Then edit `.env` with your actual credentials:

```bash
# Get these from Supabase Dashboard > Settings > API
EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-actual-anon-key

# Point to your backend (use your computer's IP for physical devices)
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000

EXPO_PUBLIC_ENV=development
```

> **Note for Physical Devices**: If testing on a physical phone, replace `localhost` with your computer's IP address (e.g., `http://192.168.1.100:3000`). Find your IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

## Step 2: Restart Expo

After creating/updating `.env`, restart your Expo development server:

```bash
# Press Ctrl+C to stop the current server
npm start -- --reset-cache
```

## Step 3: Test the Integration

1. **Start the backend server** (in a separate terminal):
   ```bash
   cd backend
   npm run dev
   ```

2. **Open the mobile app** in simulator/device

3. **Watch the feed load**:
   - Loading indicator should appear
   - If successful: tasks/candidates will load from your backend
   - If error: You'll see an error message with a retry button

## What's Already Integrated

✅ **FeedScreen** now:
- Fetches real data from `/api/feed`
- Shows loading states
- Handles errors gracefully
- Confirms candidates → creates tasks
- Ignores candidates
- Shows optimistic UI updates

✅ **AuthContext** ready for:
- Sign up / Sign in (when you add auth screens)
- Session management
- Auto token refresh

✅ **API Service** provides:
- `getFeed()` - Get all tasks and candidates
- `confirmCandidate()` - One-tap confirm
- `ignoreCandidate()` - Dismiss candidate
- `updateTask()` - Modify task
- `completeTask()` - Mark done
- And many more...

## Common Issues

### "Network request failed"

**Cause**: Backend not running or wrong URL

**Fix**:
1. Make sure backend is running: `cd backend && npm run dev`
2. Check `EXPO_PUBLIC_BACKEND_URL` in `.env`
3. For physical devices, use your computer's IP instead of `localhost`

### "Could not load your tasks"

**Cause**: No authentication token or Supabase not configured

**Fix**:
1. Make sure `.env` has correct Supabase credentials
2. Restart Expo with `npm start -- --reset-cache`
3. Check backend logs for errors

### Changes to `.env` not working

**Fix**: Always restart Expo with cache reset after changing environment variables:
```bash
npm start -- --reset-cache
```

## Next Steps

1. **Add Authentication Screen**
   - Create login/signup UI
   - Use `useAuth()` hook for sign in/up
   - Navigate to FeedScreen after auth

2. **Add Task Detail Screen**
   - View full task details
   - Edit task
   - Mark as complete

3. **Add Pull-to-Refresh**
   ```typescript
   import { RefreshControl } from 'react-native';
   // Add to ScrollView
   refreshControl={
     <RefreshControl refreshing={loading} onRefresh={fetchFeedData} />
   }
   ```

4. **Add Real-time Updates**
   ```typescript
   // In FeedScreen
   useEffect(() => {
     const subscription = supabase
       .channel('tasks')
       .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, 
         () => fetchFeedData()
       )
       .subscribe();
     
     return () => { subscription.unsubscribe(); };
   }, []);
   ```

## Available API Functions

All available in `services/api.ts`:

**Feed**:
- `getFeed()` - Get everything
- `getNewCandidates()` - New items only
- `getUpcomingTasks()` - Upcoming tasks

**Tasks**:
- `getTasks(filters)` - List with filters
- `getTask(id)` - Single task
- `updateTask(id, updates)` - Edit
- `deleteTask(id)` - Remove
- `completeTask(id)` - Mark done

**Candidates**:
- `confirmCandidate(id, overrides)` - Confirm
- `editCandidate(id, updates)` - Edit
- `ignoreCandidate(id, reason)` - Dismiss
- `getCandidateSource(id)` - View email

**User**:
- `getUserProfile()` - Get profile
- `updateUserProfile(updates)` - Edit profile

---

**You're all set!** The mobile app is now integrated with your backend and ready to use real data. Just make sure both backend and Expo are running, and you'll see your tasks loading from Supabase! 🚀
