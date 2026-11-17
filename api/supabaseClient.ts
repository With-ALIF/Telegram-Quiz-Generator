import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
export const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
export const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  ''
).trim().replace(/^["']|["']$/g, '');

export function getSupabaseAdmin(userToken?: string) {
  const serviceKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is missing in environment variables. Falling back to anon key with auth token.");
  }
  return createClient(SUPABASE_URL || 'https://placeholder.supabase.co', serviceKey || 'placeholder-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: (!SUPABASE_SERVICE_ROLE_KEY && userToken) ? { Authorization: `Bearer ${userToken}` } : {}
    }
  });
}

export function getSupabaseUserClient(token?: string) {
  return createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  });
}
