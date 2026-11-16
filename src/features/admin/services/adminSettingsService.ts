import { supabase } from '../../../lib/supabase';

const TABLE_NAME = 'system_config';
const CONFIG_KEY = 'config';

export interface AppConfig {
  default_suffix: string;
  updated_at: any;
  updated_by: string;
}

export const fetchAppConfig = async (): Promise<AppConfig | null> => {
  try {
    const response = await fetch('/api/app-config');
    if (!response.ok) throw new Error("Failed to fetch app config");
    const data = await response.json();
    
    if (data) {
      const config: AppConfig = {
        updated_by: data.updated_by || 'System',
        default_suffix: data.default_suffix !== undefined && data.default_suffix !== null ? data.default_suffix : 'Join: https://t.me/SOT_Academy',
        updated_at: data.updated_at || new Date().toISOString()
      };
      localStorage.setItem('app_config', JSON.stringify(config));
      return config;
    }
    return null;
  } catch (error: any) {
    console.error("Error fetching app config:", error);
    const cached = localStorage.getItem('app_config');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (!parsed.default_suffix || parsed.default_suffix.trim() === '') {
                parsed.default_suffix = 'Join: https://t.me/SOT_Academy';
            }
            return parsed;
        } catch(e) {}
    }
    return {
        updated_by: 'System',
        default_suffix: 'Join: https://t.me/SOT_Academy',
        updated_at: new Date().toISOString()
    };
  }
};

export const saveAppConfig = async (config: AppConfig): Promise<{ success: boolean; error?: string }> => {
  let apiError: string | null = null;
  
  // 1. Try Backend API first (uses Supabase Service Role Key to bypass RLS)
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch('/api/admin/save-config', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        key: CONFIG_KEY,
        value: config
      })
    });

    if (response.ok) {
      localStorage.setItem('app_config', JSON.stringify(config));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app_config_updated', { detail: config }));
      }
      return { success: true };
    } else {
      const errorData = await response.json().catch(() => ({}));
      apiError = errorData.error || `HTTP ${response.status}`;
      console.warn("API /api/admin/save-config failed, attempting direct Supabase upsert fallback:", apiError);
    }
  } catch (err: any) {
    apiError = err.message || 'Network error';
    console.warn("API call failed, attempting direct Supabase upsert fallback:", err);
  }

  // 2. Fallback: Direct Supabase client upsert
  try {
    const { error: directError } = await supabase
      .from('system_config')
      .upsert({
        key: CONFIG_KEY,
        default_suffix: config.default_suffix,
        updated_by: config.updated_by || 'Admin',
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (directError) {
      console.error("Direct Supabase save failed:", directError);
      return { 
        success: false, 
        error: directError.message || apiError || 'Failed to save config in database' 
      };
    }

    localStorage.setItem('app_config', JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app_config_updated', { detail: config }));
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error saving app config:", error);
    return { success: false, error: error.message || apiError || 'Unknown error' };
  }
};
