# FaceCare AI - Supabase Authentication Setup

## Quick Setup Guide

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization and create the project
4. Wait for the project to be ready (usually 1-2 minutes)

### 2. Get Your Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with: `eyJhbGc...`)

### 3. Configure Your App

1. Open `src/config/supabase.config.ts`
2. Replace the placeholder values:
   ```typescript
   export const SUPABASE_CONFIG = {
     url: 'https://your-actual-project-id.supabase.co',     // ← Your Project URL
     anonKey: 'eyJhbGc...'                                  // ← Your anon key
   };
   ```

### 4. Enable Google Authentication (Optional)

1. In Supabase dashboard: **Authentication → Providers**
2. Enable **Google** provider
3. Go to [Google Cloud Console](https://console.cloud.google.com/)
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret back to Supabase

### 5. Test Authentication

1. Start your development server: `npm run dev`
2. Go to the login page
3. Try creating an account with email/password
4. Check your email for verification link
5. Try Google sign-in (if configured)

## Authentication Features

✅ **Email/Password Registration**
✅ **Email/Password Login**  
✅ **Google OAuth Sign-in**
✅ **Email Verification**
✅ **Session Management**
✅ **Auto-redirect on Login**
✅ **Error Handling**
✅ **Loading States**

## Security Notes

- The `anon` key is safe to use in frontend applications
- All authentication is handled securely by Supabase
- Passwords are automatically hashed and secured
- Email verification prevents fake accounts

## Troubleshooting

**"Invalid API key"**: Check that your URL and anon key are correct

**"User not confirmed"**: User needs to click the verification email

**Google sign-in not working**: Verify OAuth credentials and redirect URL

**Email not sending**: Check Supabase email settings in Authentication → Settings