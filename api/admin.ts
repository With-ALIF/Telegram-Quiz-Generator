import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, getSupabaseAdmin } from './supabaseClient.js';

function generateRandomPassword(length = 8): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function verifyAdmin(req: any): Promise<boolean> {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("verifyAdmin: Missing or invalid authorization header");
      return false;
    }
    const token = authHeader.substring(7).trim();
    if (!token) {
      console.error("verifyAdmin: Empty token");
      return false;
    }

    // Direct, clean supabase client creation matching server.ts exactly
    const instance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: { user }, error } = await instance.auth.getUser(token);
    if (error || !user) {
      console.error("verifyAdmin: Failed to getUser from token:", error?.message);
      return false;
    }

    const admins = ["alifweb@gmail.com", "alifbrur16@gmail.com"];
    if (admins.map(a => a.toLowerCase()).includes(user.email?.toLowerCase() || '')) {
      return true;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    return profile?.role === 'admin';
  } catch (err: any) {
    console.error("verifyAdmin: unexpected error:", err);
    return false;
  }
}

export default async function handler(req: any, res: any) {
  const urlObj = new URL(req.url || '', 'http://localhost');
  const pathname = urlObj.pathname;
  
  // Extract action robustly from query params, url query params, or URL path parts
  let action = req.query?.action || urlObj.searchParams.get('action');
  
  if (!action) {
    const parts = pathname.split('/');
    // Check from right to left for a valid action name
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p && p !== 'api' && p !== 'admin') {
        action = p;
        break;
      }
    }
  }

  if (!action) {
    return res.status(400).json({ error: "Action is required." });
  }

  try {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ error: "Access denied." });
    }

    const supabaseAdmin = getSupabaseAdmin();

    switch (action) {
      case 'save-config': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { key, value } = req.body;
        if (!key || !value) {
          return res.status(400).json({ error: "Invalid configuration data. Key and value are required." });
        }
        const { error } = await supabaseAdmin
          .from('system_config')
          .upsert({ 
            key, 
            updated_by: value.updated_by || 'Admin',
            default_suffix: value.default_suffix,
            updated_at: new Date().toISOString() 
          }, { onConflict: 'key' });
          
        if (error) throw error;
        return res.status(200).json({ success: true, message: "Configuration saved successfully." });
      }

      case 'list-users': {
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
        const { data: profiles, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*, profile_permissions(*)')
          .limit(2000);
          
        if (profileError) throw profileError;

        const { data: photos } = await supabaseAdmin
          .from('user_photos')
          .select('user_id, photo_url');

        const photoMap = new Map((photos || []).map(p => [p.user_id, p.photo_url]));

        // Real "last active": last sign-in from Supabase auth (fallback handled in UI)
        // Also extract Google avatar from user_metadata (avatar_url or picture)
        let lastSignInMap = new Map<string, string>();
        let googlePhotoMap = new Map<string, string>();
        try {
          const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ page: 0, perPage: 1000 });
          (authList?.users || []).forEach((u: any) => {
            if (u && u.last_sign_in_at) lastSignInMap.set(u.id, u.last_sign_in_at);
            const gPhoto = u?.user_metadata?.avatar_url || u?.user_metadata?.picture || '';
            if (gPhoto) googlePhotoMap.set(u.id, gPhoto);
          });
        } catch (authErr) {
          console.warn('Could not load auth data from Supabase Admin:', authErr);
        }

        const mergedUsers = (profiles || []).map((profile: any) => {
          const stats = {
            generated: profile.total_generated || 0,
            sent: profile.total_sent || 0
          };
          
          const perms: string[] = [];
          if (profile.profile_permissions) {
            const p = Array.isArray(profile.profile_permissions) ? profile.profile_permissions[0] : profile.profile_permissions;
            if (p) {
              if (p.ocr) perms.push('ocr');
              if (p.suffix_edit) perms.push('suffix-edit');
              if (p.rapid_fire || p['rapid-fire']) perms.push('rapid-fire');
            }
          }
          
          return {
            id: profile.id,
            email: profile.email || '',
            displayName: profile.display_name || (profile.email ? profile.email.split('@')[0] : 'Anonymous'),
            photoURL: photoMap.get(profile.id) || googlePhotoMap.get(profile.id) || '',
            role: profile.role || 'user',
            permissions: perms,
            stats: stats,
            createdAt: profile.created_at ? { seconds: Math.floor(new Date(profile.created_at).getTime() / 1000) } : { seconds: 0 },
            lastActive: lastSignInMap.get(profile.id)
              ? Math.floor(new Date(lastSignInMap.get(profile.id) as string).getTime() / 1000)
              : (profile.created_at ? Math.floor(new Date(profile.created_at).getTime() / 1000) : null)
          };
        });

        return res.status(200).json({ users: mergedUsers });
      }

      case 'poll-daily': {
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

        const daysParam = parseInt(String(req.query?.days || '30'), 10);
        const days = Number.isNaN(daysParam) ? 30 : Math.min(Math.max(daysParam, 1), 365);

        const sinceIso = new Date(Date.now() - (days - 1) * 24 * 3600 * 1000).toISOString();
        const { data: rows, error } = await supabaseAdmin
          .from('poll_questions')
          .select('created_at')
          .gte('created_at', sinceIso);

        if (error) throw error;

        // Count rows per UTC day
        const counts = new Map<string, number>();
        (rows || []).forEach((row: any) => {
          if (!row || !row.created_at) return;
          const key = new Date(row.created_at).toISOString().slice(0, 10);
          counts.set(key, (counts.get(key) || 0) + 1);
        });

        // Zero-fill every day in the range so the chart has no gaps
        const daily: { date: string; count: number }[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const key = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
          daily.push({ date: key, count: counts.get(key) || 0 });
        }

        return res.status(200).json({ days: daily });
      }

      case 'create-user': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { email, displayName, password, permissions } = req.body;
        if (!email) {
          return res.status(400).json({ error: "Email is required." });
        }

        if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === SUPABASE_ANON_KEY) {
          console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing or set to Anon key.");
          return res.status(400).json({ 
            error: "SUPABASE_SERVICE_ROLE_KEY is not configured or is set to the Anon key. Admin operations require the Service Role Key to be configured in your environment variables/Secrets." 
          });
        }

        const finalPassword = (password && password.trim().length >= 6) ? password.trim() : generateRandomPassword(8);

        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: finalPassword,
          email_confirm: true,
          user_metadata: { role: 'user', full_name: displayName }
        });

        if (createError) {
          console.error("❌ Supabase Admin createUser failed:", createError);
          let errMsg = createError.message || JSON.stringify(createError);
          if (errMsg.includes("Database error creating new user")) {
            errMsg = "Database error creating new user. This is caused by a failing database trigger (public.handle_new_user) in your Supabase project. To fix this, please run the SQL query from your 'supabase_schema.sql' file (specifically the updated exception-tolerant 'handle_new_user' trigger function) in your Supabase SQL Editor.";
          }
          return res.status(400).json({ error: errMsg });
        }

        const createdUser = userData.user;
        if (!createdUser) {
          return res.status(500).json({ error: "Could not create user account." });
        }

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: createdUser.id,
            email: createdUser.email,
            display_name: displayName || '',
            role: 'user'
          }, { onConflict: 'id' });

        if (profileError) {
          console.error("❌ Profile record creation failed:", profileError.message);
          // Clean up created Auth user to avoid orphaned accounts
          await supabaseAdmin.auth.admin.deleteUser(createdUser.id);
          return res.status(400).json({ error: `Database error creating user profile: ${profileError.message}` });
        }

        const permObj = {
          id: createdUser.id,
          ocr: (permissions || []).includes('ocr'),
          suffix_edit: (permissions || []).includes('suffix-edit'),
          rapid_fire: (permissions || []).includes('rapid-fire'),
        };

        const { error: permConfigError } = await supabaseAdmin
          .from('profile_permissions')
          .upsert(permObj, { onConflict: 'id' });

        if (permConfigError) {
          console.error("❌ Permissions config creation failed:", permConfigError.message);
          // Clean up profile and Auth user
          await supabaseAdmin.from('profiles').delete().eq('id', createdUser.id);
          await supabaseAdmin.auth.admin.deleteUser(createdUser.id);
          return res.status(400).json({ error: `Database error configuring user permissions: ${permConfigError.message}` });
        }

        return res.status(200).json({
          success: true,
          user: {
            id: createdUser.id,
            email: createdUser.email,
            displayName: displayName,
            password: finalPassword
          }
        });
      }

      case 'delete-user': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { userId } = req.body;
        if (!userId) {
          return res.status(400).json({ error: "User ID is required." });
        }

        if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === SUPABASE_ANON_KEY) {
          return res.status(400).json({ 
            error: "SUPABASE_SERVICE_ROLE_KEY is not configured or is set to the Anon key. Admin operations require the Service Role Key." 
          });
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
          console.error("❌ Supabase Admin deleteUser failed:", deleteError);
          return res.status(400).json({ error: deleteError.message || JSON.stringify(deleteError) });
        }

        return res.status(200).json({ success: true, message: "User deleted successfully" });
      }

      case 'reset-password': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { userId, newPassword } = req.body;
        if (!userId || !newPassword) {
          return res.status(400).json({ error: "User ID and new password are required." });
        }

        if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === SUPABASE_ANON_KEY) {
          return res.status(400).json({ 
            error: "SUPABASE_SERVICE_ROLE_KEY is not configured or is set to the Anon key. Admin operations require the Service Role Key." 
          });
        }

        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: newPassword
        });

        if (resetError) {
          console.error("❌ Supabase Admin resetPassword failed:", resetError);
          return res.status(400).json({ error: resetError.message || JSON.stringify(resetError) });
        }

        return res.status(200).json({ success: true, message: "Password reset successfully" });
      }

      case 'update-permissions': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { userId, permissions } = req.body;
        if (!userId) {
          return res.status(400).json({ error: "User ID is required." });
        }

        const permObj = {
          id: userId,
          ocr: (permissions || []).includes('ocr'),
          suffix_edit: (permissions || []).includes('suffix-edit'),
          rapid_fire: (permissions || []).includes('rapid-fire'),
        };

        const { error } = await supabaseAdmin
          .from('profile_permissions')
          .upsert(permObj);

        if (error) {
          return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ success: true });
      }

      case 'save-config': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { key, value } = req.body || {};
        if (!key) {
          return res.status(400).json({ error: "Key is required." });
        }

        const { data, error } = await supabaseAdmin
          .from('system_config')
          .upsert({
            key,
            updated_by: value?.updated_by || 'Admin',
            default_suffix: value?.default_suffix ?? '',
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' })
          .select();

        if (error) {
          console.error("Supabase upsert error in api/admin save-config:", error);
          return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ success: true, data });
      }

      default: {
        return res.status(404).json({ error: "Action not found" });
      }
    }
  } catch (err: any) {
    console.error(`Error in admin API action ${action}:`, err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
