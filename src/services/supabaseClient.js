import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Provide fallbacks to prevent fatal synchronous crashes if EXPO_PUBLIC variables are stripped in release builds
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fallback.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'fallback-anon-key';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);