// ========================================
// SUPABASE CONFIGURATION
// ========================================
// 
// Configuration is now loaded from environment variables
// Make sure to add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file
// ========================================

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
};

// ========================================
// GOOGLE OAUTH SETUP (OPTIONAL)
// ========================================
// 
// To enable Google Sign-In:
// 
// 1. In your Supabase dashboard, go to Authentication → Providers
// 2. Enable Google provider
// 3. Go to https://console.cloud.google.com/
// 4. Create OAuth 2.0 credentials
// 5. Add this redirect URL: https://your-project.supabase.co/auth/v1/callback
// 6. Copy Client ID and Secret to Supabase
// 
// ========================================