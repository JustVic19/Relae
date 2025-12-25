# Supabase Authentication Implementation

## Overview

Implementing comprehensive user authentication for the Relae student productivity app using Supabase, including:
- Email/password authentication
- Google OAuth sign-in
- Apple OAuth sign-in
- Password reset functionality
- Email verification
- Session persistence with "Remember Me"
- Protected routes

The implementation will fully migrate to Supabase, replacing the existing backend authentication with Supabase's auth system while maintaining your beautiful UI design.

---

## User Review Required

> [!IMPORTANT]
> **Supabase OAuth Configuration Required**
> 
> Before implementing social login, you'll need to configure OAuth providers in your Supabase dashboard. I'll provide step-by-step instructions for setting up **Google** and **Apple** OAuth.

> [!IMPORTANT]
> **Database Migration**
> 
> Your existing `schema.sql` already references Supabase's `auth.users` table. We'll need to run this schema in your Supabase project to set up the database properly.

---

## Proposed Changes

### Authentication Infrastructure

#### [MODIFY] [supabase.ts](file:///Users/victor/Library/Mobile%20Documents/com~apple~CloudDocs/Relae/mobile/lib/supabase.ts)
- ✅ Already configured with AsyncStorage for session persistence
- No changes needed - configuration is optimal

#### [MODIFY] [AuthContext.tsx](file:///Users/victor/Library/Mobile%20Documents/com~apple~CloudDocs/Relae/mobile/contexts/AuthContext.tsx)
- Add social login methods (`signInWithGoogle`, `signInWithApple`)
- Add password reset method (`resetPassword`)
- Add email verification check
- Add "Remember Me" functionality
- Enhance error handling with user-friendly messages
- Add loading states for each auth operation

---

### UI Screens

#### [NEW] [LoginScreen.tsx](file:///Users/victor/Library/Mobile%20Documents/com~apple~CloudDocs/Relae/mobile/screens/LoginScreen.tsx)
New screen matching your existing design aesthetic with:
- Email/password input fields with validation
- "Remember Me" checkbox
- "Forgot Password?" link
- Social login buttons (Google, Apple)
- Navigation to sign-up screen
- Error handling UI
- Loading states

#### [NEW] [SignUpScreen.tsx](file:///Users/victor/Library/Mobile%20Documents/com~apple~CloudDocs/Relae/mobile/screens/SignUpScreen.tsx)
New screen for user registration with:
- Email input with validation
- Password input with strength indicator
- Confirm password field
- Terms of service checkbox
- Social sign-up options (Google, Apple)
- Navigation to login screen
- Error handling UI

#### [NEW] [ForgotPasswordScreen.tsx](file:///Users/victor/Library/Mobile%20Documents/com~apple~CloudDocs/Relae/mobile/screens/ForgotPasswordScreen.tsx)
Password reset screen with:
- Email input for reset link
- Success message display
- Back to login navigation
- Error handling

#### [MODIFY] [AuthScreen.tsx](file:///Users/victor/Library/Mobile%20Documents/com~apple~CloudDocs/Relae/mobile/screens/AuthScreen.tsx)
Update to navigate to the new login/signup screens instead of directly handling auth

#### [MODIFY] [OnboardingContainer.tsx](file:///Users/victor/Library/Mobile%20Documents/com~apple~CloudDocs/Relae/mobile/screens/OnboardingContainer.tsx)
- Update `handleLogin` to navigate to `LoginScreen`
- Update `handleRegister` to navigate to `SignUpScreen`
- Remove Face ID handler (can add later as biometric enhancement)

---

### Navigation & App Structure

#### [MODIFY] [App.tsx](file:///Users/victor/Library/Mobile%20Documents/com~apple~CloudDocs/Relae/mobile/App.tsx)
- Add new authentication screens to navigation stack
- Implement protected route logic
- Add automatic navigation based on auth state
- Handle deep linking for email verification

---

### Configuration Files

#### [MODIFY] [app.json](file:///Users/victor/Library/Mobile%20Documents/com~apple~CloudDocs/Relae/mobile/app.json)
- Add OAuth redirect scheme for Google/Apple sign-in
- Configure deep linking for email verification
- Add bundle identifier (required for Apple Sign-In)

#### [MODIFY] [package.json](file:///Users/victor/Library/Mobile%20Documents/com~apple~CloudDocs/Relae/mobile/package.json)
- Add `expo-auth-session` for OAuth flows
- Add `expo-crypto` for secure token generation
- Add `expo-web-browser` for OAuth browser sessions
- Add `expo-apple-authentication` for native Apple Sign-In
- Add `expo-local-authentication` (optional - for future Face ID/Touch ID)

---

## Supabase Configuration Guide

### Step 1: Run Database Schema

1. Open your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `kikaavafovalupmhzmpc`
3. Go to **SQL Editor** in the left sidebar
4. Copy the entire contents of your `schema.sql` file
5. Paste and run it to create all necessary tables

### Step 2: Configure Email Settings

1. In Supabase Dashboard → **Authentication** → **Email Templates**
2. Customize the confirmation email template (optional)
3. Under **Authentication** → **Settings**:
   - Set **Confirm email** to `disabled` (users can use app immediately)
   - Keep **Enable email confirmations** `enabled` (for second verification option)
   - Set **Mailer autoconfirm** to `false`

### Step 3: Configure Google OAuth

1. **Create Google OAuth App:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable **Google+ API**
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Select **iOS** application type
   - Add your bundle identifier (e.g., `com.yourcompany.relae`)
   - Download the configuration file

2. **Add Web Client for Expo:**
   - Create another OAuth Client ID with type **Web application**
   - Add redirect URI: `https://kikaavafovalupmhzmpc.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**

3. **Configure in Supabase:**
   - Supabase Dashboard → **Authentication** → **Providers**
   - Enable **Google**
   - Paste **Client ID** and **Client Secret**
   - Save changes

### Step 4: Configure Apple Sign-In

1. **Apple Developer Setup:**
   - Go to [Apple Developer Portal](https://developer.apple.com/)
   - **Certificates, Identifiers & Profiles** → **Identifiers**
   - Create a new **App ID** with Sign In with Apple capability
   - Create a **Services ID** (this will be your OAuth Client ID)
   - Configure the Services ID:
     - Primary App ID: Select the App ID you just created
     - Return URLs: `https://kikaavafovalupmhzmpc.supabase.co/auth/v1/callback`
   - Create a **Key** for Sign In with Apple
   - Download the key file (.p8)

2. **Configure in Supabase:**
   - Supabase Dashboard → **Authentication** → **Providers**
   - Enable **Apple**
   - Enter:
     - **Services ID** (Client ID)
     - **Team ID** (from Apple Developer Account)
     - **Key ID** (from the key you created)
     - **Private Key** (contents of the .p8 file)
   - Save changes

### Step 5: Configure Redirect URLs

In Supabase Dashboard → **Authentication** → **URL Configuration**:
- Add **Redirect URLs**:
  - `exp://localhost:8081` (for local development)
  - `relae://` (custom scheme)
  - Your production URL when deployed

---

## Verification Plan

### Automated Tests

Currently, there are no existing test files in the mobile app. We will create basic auth tests:

**New Test File:** `__tests__/auth.test.ts`
- Test email/password sign up
- Test email/password login
- Test password reset request
- Test session persistence
- Test sign out

**Run command:**
```bash
cd mobile
npm test
```

### Manual Verification Steps

After implementation, perform these tests in sequence:

#### Test 1: Email/Password Sign Up
1. Start the Expo dev server: `npm start`
2. Open app on iOS Simulator or device
3. Navigate through onboarding to Auth screen
4. Tap "Register" button
5. Fill in email and password
6. Submit the form
7. **Expected:** User is created and logged in, redirected to Feed screen
8. Check Supabase Dashboard → Authentication → Users to verify user was created

#### Test 2: Email/Password Login
1. Sign out from the app
2. Tap "Log in" button
3. Enter credentials from Test 1
4. Submit the form
5. **Expected:** User logs in successfully, redirected to Feed screen

#### Test 3: Google Sign-In
1. Sign out from the app
2. Tap "Log in" button
3. Tap the Google sign-in button
4. Complete Google OAuth flow in browser
5. **Expected:** User authenticates and is redirected back to app, then to Feed screen
6. Verify new user in Supabase Dashboard

#### Test 4: Apple Sign-In
1. Sign out from the app
2. Tap "Log in" button
3. Tap the Apple sign-in button
4. Complete Apple authentication
5. **Expected:** User authenticates and is redirected to Feed screen
6. Verify new user in Supabase Dashboard

#### Test 5: Password Reset
1. On login screen, tap "Forgot Password?"
2. Enter email address
3. Submit the form
4. **Expected:** Success message shown
5. Check email inbox for reset link
6. Click link and verify redirect to password reset page

#### Test 6: Session Persistence
1. Log in with "Remember Me" enabled
2. Close the app completely (force quit)
3. Reopen the app
4. **Expected:** User is still logged in, goes directly to Feed screen

#### Test 7: Email Verification (Optional Flow)
1. Login as a new user
2. Navigate to settings/profile (to be implemented)
3. Check for email verification status
4. Request verification email
5. **Expected:** Verification email sent, user can verify later
