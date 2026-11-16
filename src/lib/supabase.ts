/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

export const configuredUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
export const configuredAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isConfigured = Boolean(
  configuredUrl && 
  configuredAnonKey && 
  !configuredUrl.includes('placeholder')
);

if (!isConfigured) {
  console.warn('⚠️ Supabase configuration is missing in the browser environment.');
  console.warn('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
}

export const supabase = createClient(
  configuredUrl || 'https://placeholder.supabase.co', 
  configuredAnonKey || 'placeholder-key'
);

