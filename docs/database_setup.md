# Supabase Database Setup

## Running the Schema

Your database schema is already prepared in `backend/db/schema.sql`. Here's how to set it up in Supabase:

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `kikaavafovalupmhzmpc`
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Run the Schema

1. Open `/Users/victor/Library/Mobile Documents/com~apple~CloudDocs/Relae/backend/db/schema.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Tables Created

After running, you should see these tables in **Database** > **Tables**:
- `user_profiles`
- `email_integrations`
- `source_messages`
- `task_candidates`
- `threads`
- `tasks`
- `audit_events`

All tables should have Row Level Security (RLS) enabled.

---

## Important: Add User Profile Trigger

Your schema creates the `user_profiles` table, but you need a trigger to automatically create a profile when a user signs up. Run this additional SQL:

```sql
-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function when new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

This ensures every user who signs up gets a corresponding entry in `user_profiles`.

---

## Testing the Setup

1. Try signing up with a test email in your app
2. Go to **Authentication** > **Users** in Supabase
3. Verify the user appears
4. Go to **Database** > **user_profiles** table
5. Verify a profile was created for that user

---

## OAuth Redirect URLs

Make sure these are configured in **Authentication** > **URL Configuration**:

**Redirect URLs:**
- `relae://auth/callback`
- `exp://localhost:8081`
- `http://localhost:8081`

**Site URL:**
- `relae://`

This ensures OAuth flows (Google, Apple) can redirect back to your app properly.
