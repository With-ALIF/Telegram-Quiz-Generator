import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import webhookHandler from "./api/webhook.ts";
import setupHandler from "./api/setup.ts";
import quizHandler from "./api/quiz.ts";

dotenv.config({ override: true });

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  ''
).trim().replace(/^["']|["']$/g, '');

function getAdminClient(token?: string) {
  const serviceKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: (!SUPABASE_SERVICE_ROLE_KEY && token) ? { Authorization: `Bearer ${token}` } : {}
    }
  });
}

async function initSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("⚠️ [WARNING] Supabase URL or Service Role Key is missing in environment variables. The server will run, but admin user creation and verification will be unavailable. Please add them to your .env file.");
    return;
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test connection first
    const { error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 0, perPage: 1 });
    
    if (listError) {
      if (listError.message?.includes('getaddrinfo') || listError.message?.includes('fetch failed')) {
        console.error("❌ Connection Failed: Could not reach Supabase. Please check your VITE_SUPABASE_URL.");
      } else {
        console.error("❌ Supabase Admin Error:", listError.message);
      }
      return;
    }

    console.log("✅ Supabase Admin connected successfully.");
  } catch (error: any) {
    console.error("❌ Unexpected error in initSupabaseAdmin:", error.message || error);
  }
}

function generateRandomPassword(length = 8): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function verifyAdmin(req: express.Request): Promise<boolean> {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("verifyAdmin: Missing or invalid auth header");
      return false;
    }
    const token = authHeader.substring(7).trim();
    if (!token) {
        console.log("verifyAdmin: Missing token");
        return false;
    }

    // Use full target Supabase client for token validation
    const instance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error } = await instance.auth.getUser(token);
    if (error || !user) {
      console.log("verifyAdmin: Error getting user from token or no user", error?.message);
      return false;
    }

    const admins = ["alifweb@gmail.com", "alifbrur16@gmail.com"];
    if (admins.map(a => a.toLowerCase()).includes(user.email?.toLowerCase() || '')) {
      return true;
    }

    const supabaseAdmin = getAdminClient(token);
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
        console.log("verifyAdmin: User is not admin", user.email, profile?.role);
    }
    return profile?.role === 'admin';
  } catch (err) {
    console.log("verifyAdmin: Error", err);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Supabase Admin for user management
  await initSupabaseAdmin();

  // Global Health Checks (Must be at the top to satisfy deployment probes)
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.all("/", (req, res, next) => {
    const ua = req.headers['user-agent'] || '';
    if (ua.includes('UptimeRobot') || ua.includes('GoogleHC') || req.query.ping) {
      return res.status(200).send("OK");
    }
    next();
  });

  app.use("/api", express.json({ limit: '10mb' })); // support larger image base64 uploads
  
  // Supabase Proxy Route to prevent "Failed to fetch" due to browser shield/cross-origin iframe blocks
  app.all("/api/supabase-proxy*", async (req, res) => {
    const prefix = "/api/supabase-proxy";
    const subpath = req.path.startsWith(prefix) ? req.path.substring(prefix.length) : req.path;
    const cleanSubpath = ('/' + subpath).replace(/\/+/g, '/');
    
    const queryStr = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const cleanSupabaseUrl = SUPABASE_URL.replace(/\/+$/, '');
    if (!cleanSupabaseUrl) {
      console.error("[Proxy] ERROR: SUPABASE_URL is not configured. SUPABASE_URL:", SUPABASE_URL, ", VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL);
      return res.status(500).json({ error: "Supabase URL is not configured." });
    }
    const targetUrl = `${cleanSupabaseUrl}${cleanSubpath}${queryStr}`;

    console.log(`[Proxy] Routing ${req.method} ${req.url} -> ${targetUrl}. CleanSupabaseUrl: ${cleanSupabaseUrl}`);

    try {
      const headers: Record<string, string> = {};
      const excludedHeaders = ['host', 'origin', 'referer', 'content-length', 'accept-encoding', 'connection'];
      
      for (const [key, value] of Object.entries(req.headers)) {
        if (value && typeof value === 'string' && !excludedHeaders.includes(key.toLowerCase())) {
          headers[key] = value;
        }
      }

      // Automatically inject and normalize valid API keys to protect against stale/mismatching keys in client env
      const incomingApiKey = req.headers['apikey'] as string;
      const cleanAnonKey = SUPABASE_ANON_KEY.trim();
      
      headers['apikey'] = cleanAnonKey;
      
      const authHeader = req.headers['authorization'] as string;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        // If the bearer token matches the client's public api key or is stale, it's a guest request. Translate it to the known working anon key.
        if (token === incomingApiKey || token === 'VITE_SUPABASE_ANON_KEY' || token.includes('guwimglpjxstczuocary') || token.includes('VITE_SUPABASE_ANON_KEY')) {
          headers['authorization'] = `Bearer ${cleanAnonKey}`;
        }
      } else if (!authHeader) {
        headers['authorization'] = `Bearer ${cleanAnonKey}`;
      }

      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      if (clientIp) {
        headers['x-forwarded-for'] = typeof clientIp === 'string' ? clientIp : clientIp[0];
      }

      const init: RequestInit = {
        method: req.method,
        headers: headers,
      };

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        if (req.body) {
          if (typeof req.body === 'string') {
            init.body = req.body;
          } else if (Buffer.isBuffer(req.body)) {
            init.body = new Uint8Array(req.body);
          } else if (Object.keys(req.body).length > 0) {
            init.body = JSON.stringify(req.body);
          }
        }
      }

      let response: Response | null = null;
      let lastError: any = null;
      const maxAttempts = 3;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          response = await fetch(targetUrl, init);
          break; // successfully fetched, break retry loop
        } catch (error: any) {
          lastError = error;
          console.warn(`[Proxy] Fetch attempt ${attempt} failed for ${targetUrl}: ${error?.message || error}`);
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 300 * attempt));
          }
        }
      }

      if (!response) {
        throw lastError || new Error("Failed after maximum retries");
      }
      
      console.log(`[Proxy] Target response status: ${response.status} for ${targetUrl}`);

      response.headers.forEach((value, key) => {
        if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      res.status(response.status);
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      console.error("❌ Supabase Proxy Error (FETCH FAILED):", {
        message: error.message,
        stack: error.stack,
        url: targetUrl,
        method: req.method
      });
      res.status(500).json({ error: error.message || "Internal Supabase Proxy Error" });
    }
  });
  
  app.post("/api/webhook", (req, res) => webhookHandler(req, res));
  app.get("/api/setup", (req, res) => setupHandler(req, res));
  app.post("/api/quiz/generate", (req, res) => quizHandler(req, res));
  app.post("/api/quiz/generateFromImage", (req, res) => quizHandler(req, res));
  
  function getTelegramBotToken(req?: express.Request): string | null {
    const candidates = [
      req?.headers?.['x-telegram-bot-token'] as string,
      req?.body?.bot_token,
      req?.query?.bot_token as string,
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.BOT_TOKEN,
      process.env.TELEGRAM_TOKEN,
      process.env.VITE_TELEGRAM_BOT_TOKEN
    ];

    for (const raw of candidates) {
      if (raw && typeof raw === 'string') {
        const trimmed = raw.trim().replace(/^['"]|['"]$/g, '').trim();
        const cleaned = trimmed.replace(/^bot/i, '').trim();
        if (cleaned.length > 5) {
          return cleaned;
        }
      }
    }
    return null;
  }

  function formatTelegramApiError(data: any, cleanChatId?: string): string {
    const desc = (data?.description || data?.error || "").toLowerCase();
    if (desc === "not found" || (desc.includes("not found") && !desc.includes("chat"))) {
      return "Telegram Bot Token টি সঠিক নয় বা পাওয়া যায়নি (Telegram API: 'Not Found')। নিশ্চিত করুন Settings > Secrets এ সঠিক TELEGRAM_BOT_TOKEN যুক্ত করেছেন।";
    }
    if (desc.includes("chat not found")) {
      return `Chat ID পাওয়া যায়নি! (ID: ${cleanChatId || "unknown"})। নিশ্চিত করুন বটটি আপনার চ্যানেল বা গ্রুপে Admin হিসেবে যুক্ত আছে এবং Chat ID টি সঠিক।`;
    }
    if (desc.includes("unauthorized")) {
      return "টেলিগ্রাম বট টোকেনটি সঠিক নয় (Unauthorized)। দয়া করে Bot Token টি যাচাই করুন।";
    }
    if (desc.includes("user_bot_to_bot_disabled")) {
      return "বট অন্য বটকে মেসেজ পাঠাতে পারে না। অনুগ্রহ করে চ্যানেলের ইউজারনেম বা আইডি (@channel_name বা -100...) দিন।";
    }
    if (desc.includes("not enough rights") || desc.includes("restricted") || desc.includes("admin") || desc.includes("have no rights") || desc.includes("not a member") || desc.includes("kicked")) {
      return "বটটির চ্যানেলে মেসেজ/পোল পাঠানোর অনুমতি নেই। অনুগ্রহ করে বটকে চ্যানেলে যোগ করে Administrator বানান এবং 'Post Messages' পারমিশন দিন।";
    }
    if (desc.includes("blocked by the user")) {
      return "বটটি ব্লক করা হয়েছে। টেলিগ্রামে গিয়ে বটটি আনব্লক করুন।";
    }
    if (desc.includes("poll explanation must not be empty")) {
      return "Explanation ফিল্ড খালি রাখা যাবে না।";
    }
    if (desc.includes("poll options must have at least 2")) {
      return "কুইজে কমপক্ষে ২টি অপশন থাকতে হবে।";
    }
    if (desc.includes("poll option text is too long")) {
      return "কুইজের কোনো অপশন ১০০ অক্ষরের বেশি হতে পারবে না।";
    }
    return data?.description || data?.error || "Failed to communicate with Telegram";
  }

  async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 15000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(id);
    }
  }

  app.post("/api/telegram/sendPoll", async (req, res) => {
    try {
      const cleanToken = getTelegramBotToken(req);
      if (!cleanToken) {
        return res.status(400).json({ 
          ok: false,
          error: "টেলিগ্রাম বট টোকেন পাওয়া যায়নি। দয়া করে Settings > Secrets-এ TELEGRAM_BOT_TOKEN যুক্ত করুন।" 
        });
      }

      const { chat_id } = req.body;
      if (!chat_id) {
        return res.status(400).json({ ok: false, error: "chat_id is required." });
      }

      const cleanChatId = String(chat_id).trim();

      // Normalize options
      let rawOptions = req.body.options;
      if (typeof rawOptions === 'string') {
        try {
          rawOptions = JSON.parse(rawOptions);
        } catch (e) {}
      }
      let formattedOptions: string[] = [];
      if (Array.isArray(rawOptions)) {
        formattedOptions = rawOptions.map((opt: any) => {
          if (typeof opt === 'string') return opt.trim().substring(0, 100);
          if (opt && typeof opt === 'object' && opt.text) return String(opt.text).trim().substring(0, 100);
          return String(opt || '').trim().substring(0, 100);
        }).filter(Boolean);
      }

      if (formattedOptions.length < 2 || formattedOptions.length > 10) {
        return res.status(400).json({
          ok: false,
          error: "Telegram polls must contain between 2 and 10 options."
        });
      }

      const correctIndex = Math.max(0, Math.min(formattedOptions.length - 1, Number(req.body.correct_option_id ?? 0)));

      const payload: Record<string, any> = {
        chat_id: cleanChatId,
        question: (String(req.body.question || '').trim() || 'Quiz Question').substring(0, 300),
        options: formattedOptions,
        is_anonymous: req.body.is_anonymous !== false,
        type: req.body.type || "quiz",
        correct_option_id: correctIndex
      };

      const explanation = typeof req.body.explanation === 'string' ? req.body.explanation.trim() : '';
      if (explanation.length > 0) {
        payload.explanation = explanation.substring(0, 200);
        payload.explanation_parse_mode = req.body.explanation_parse_mode || "HTML";
      }

      if (req.body.reply_to_message_id) {
        payload.reply_to_message_id = Number(req.body.reply_to_message_id);
      }

      let response = await fetchWithTimeout(`https://api.telegram.org/bot${cleanToken}/sendPoll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let resText = await response.text();
      let data: any = {};
      try {
        data = resText ? JSON.parse(resText) : {};
      } catch {
        data = { ok: false, description: resText || `Telegram HTTP ${response.status}` };
      }

      // Automatic fallback: if HTML parse failed on explanation, retry as plain text
      if ((!response.ok || !data.ok) && payload.explanation_parse_mode && (data.description || '').toLowerCase().includes('parse')) {
        delete payload.explanation_parse_mode;
        if (payload.explanation) {
          payload.explanation = payload.explanation.replace(/<[^>]*>/g, '').substring(0, 200);
        }
        response = await fetchWithTimeout(`https://api.telegram.org/bot${cleanToken}/sendPoll`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        resText = await response.text();
        try {
          data = resText ? JSON.parse(resText) : {};
        } catch {
          data = { ok: false, description: resText || `Telegram HTTP ${response.status}` };
        }
      }

      if (!response.ok || !data.ok) {
        const errorMsg = formatTelegramApiError(data, cleanChatId);
        return res.status(response.status || 400).json({
          ...data,
          ok: false,
          error: errorMsg
        });
      }

      return res.status(200).json(data);
    } catch (err: any) {
      console.error("Error in Telegram sendPoll proxy:", err);
      let errorMsg = err.message || "Internal server error during Telegram poll request";
      if (err.name === 'AbortError' || err.message?.toLowerCase().includes('abort') || err.message?.toLowerCase().includes('timeout')) {
        errorMsg = "টেলিগ্রাম সার্ভারের সাথে সংযোগের সময় শেষ হয়েছে (Timeout)। অনুগ্রহ করে আপনার নেটওয়ার্ক এবং বট টোকেনটি চেক করুন।";
      }
      return res.status(504).json({ ok: false, error: errorMsg });
    }
  });

  app.post("/api/telegram/sendMessage", async (req, res) => {
    try {
      const cleanToken = getTelegramBotToken(req);
      if (!cleanToken) {
        return res.status(400).json({ 
          ok: false,
          error: "টেলিগ্রাম বট টোকেন পাওয়া যায়নি। দয়া করে Settings > Secrets-এ TELEGRAM_BOT_TOKEN যুক্ত করুন।" 
        });
      }

      const { chat_id, text } = req.body;
      if (!chat_id) {
        return res.status(400).json({ ok: false, error: "chat_id is required." });
      }
      if (!text) {
        return res.status(400).json({ ok: false, error: "text is required." });
      }

      const cleanChatId = String(chat_id).trim();
      const payload: Record<string, any> = {
        chat_id: cleanChatId,
        text: String(text)
      };

      if (req.body.parse_mode) payload.parse_mode = req.body.parse_mode;
      if (req.body.reply_to_message_id) payload.reply_to_message_id = Number(req.body.reply_to_message_id);

      let response = await fetchWithTimeout(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let resText = await response.text();
      let data: any = {};
      try {
        data = resText ? JSON.parse(resText) : {};
      } catch {
        data = { ok: false, description: resText || `Telegram HTTP ${response.status}` };
      }

      // Automatic fallback: if markdown/HTML parse failed, retry as plain text
      if ((!response.ok || !data.ok) && payload.parse_mode) {
        delete payload.parse_mode;
        response = await fetchWithTimeout(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        resText = await response.text();
        try {
          data = resText ? JSON.parse(resText) : {};
        } catch {
          data = { ok: false, description: resText || `Telegram HTTP ${response.status}` };
        }
      }

      if (!response.ok || !data.ok) {
        const errorMsg = formatTelegramApiError(data, cleanChatId);
        return res.status(response.status || 400).json({
          ...data,
          ok: false,
          error: errorMsg
        });
      }

      return res.status(200).json(data);
    } catch (err: any) {
      console.error("Error in Telegram sendMessage proxy:", err);
      let errorMsg = err.message || "Internal server error during Telegram sendMessage request";
      if (err.name === 'AbortError' || err.message?.toLowerCase().includes('abort') || err.message?.toLowerCase().includes('timeout')) {
        errorMsg = "টেলিগ্রাম সার্ভারের সাথে সংযোগের সময় শেষ হয়েছে (Timeout)। অনুগ্রহ করে আপনার নেটওয়ার্ক এবং বট টোকেনটি চেক করুন।";
      }
      return res.status(504).json({ ok: false, error: errorMsg });
    }
  });

  app.post("/api/telegram/sendPhoto", async (req, res) => {
    try {
      const cleanToken = getTelegramBotToken(req);
      if (!cleanToken) {
        return res.status(400).json({ 
          ok: false,
          error: "টেলিগ্রাম বট টোকেন পাওয়া যায়নি। দয়া করে Settings > Secrets-এ TELEGRAM_BOT_TOKEN যুক্ত করুন।" 
        });
      }

      const { chat_id, image, photo, caption, parse_mode, reply_to_message_id } = req.body;
      if (!chat_id) {
        return res.status(400).json({ ok: false, error: "chat_id is required." });
      }

      const rawPhoto = image || photo;
      if (!rawPhoto) {
        return res.status(400).json({ ok: false, error: "image or photo data is required." });
      }

      const cleanChatId = String(chat_id).trim();
      const formData = new FormData();
      formData.append('chat_id', cleanChatId);

      if (rawPhoto.startsWith('http://') || rawPhoto.startsWith('https://')) {
        formData.append('photo', rawPhoto);
      } else {
        const base64Data = rawPhoto.includes(',') ? rawPhoto.split(',')[1] : rawPhoto;
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        formData.append('photo', blob, 'image.jpg');
      }

      if (caption && String(caption).trim()) {
        formData.append('caption', String(caption).trim());
      }
      if (parse_mode) {
        formData.append('parse_mode', parse_mode);
      }
      if (reply_to_message_id) {
        formData.append('reply_to_message_id', String(reply_to_message_id));
      }

      const response = await fetchWithTimeout(`https://api.telegram.org/bot${cleanToken}/sendPhoto`, {
        method: 'POST',
        body: formData
      });

      const resText = await response.text();
      let data: any = {};
      try {
        data = resText ? JSON.parse(resText) : {};
      } catch {
        data = { ok: false, description: resText || `Telegram HTTP ${response.status}` };
      }

      if (!response.ok || !data.ok) {
        const errorMsg = formatTelegramApiError(data, cleanChatId);
        return res.status(response.status || 400).json({
          ...data,
          ok: false,
          error: errorMsg
        });
      }

      return res.status(200).json(data);
    } catch (err: any) {
      console.error("Error in Telegram sendPhoto proxy:", err);
      let errorMsg = err.message || "Internal server error during Telegram sendPhoto request";
      if (err.name === 'AbortError' || err.message?.toLowerCase().includes('abort') || err.message?.toLowerCase().includes('timeout')) {
        errorMsg = "টেলিগ্রাম সার্ভারের সাথে সংযোগের সময় শেষ হয়েছে (Timeout)। অনুগ্রহ করে আপনার নেটওয়ার্ক এবং বট টোকেনটি চেক করুন।";
      }
      return res.status(504).json({ ok: false, error: errorMsg });
    }
  });

  app.get("/api/telegram/getChat", async (req, res) => {
    try {
      const cleanToken = getTelegramBotToken(req);
      if (!cleanToken) {
        return res.status(400).json({ 
          ok: false,
          error: "টেলিগ্রাম বট টোকেন পাওয়া যায়নি। দয়া করে Settings > Secrets-এ TELEGRAM_BOT_TOKEN যুক্ত করুন।" 
        });
      }

      const chatId = req.query.chat_id as string;
      if (!chatId) {
        return res.status(400).json({ ok: false, error: "chat_id query parameter is required." });
      }

      const cleanChatId = chatId.trim();
      const response = await fetchWithTimeout(`https://api.telegram.org/bot${cleanToken}/getChat?chat_id=${encodeURIComponent(cleanChatId)}`);
      
      const resText = await response.text();
      let data: any = {};
      try {
        data = resText ? JSON.parse(resText) : {};
      } catch {
        data = { ok: false, description: resText || `Telegram HTTP ${response.status}` };
      }

      if (!response.ok || !data.ok) {
        const errorMsg = formatTelegramApiError(data, cleanChatId);
        return res.status(response.status || 400).json({
          ...data,
          ok: false,
          error: errorMsg
        });
      }

      return res.status(200).json(data);
    } catch (err: any) {
      console.error("Error in Telegram getChat proxy:", err);
      let errorMsg = err.message || "Internal server error during Telegram getChat request";
      if (err.name === 'AbortError' || err.message?.toLowerCase().includes('abort') || err.message?.toLowerCase().includes('timeout')) {
        errorMsg = "টেলিগ্রাম সার্ভারের সাথে সংযোগের সময় শেষ হয়েছে (Timeout)। অনুগ্রহ করে আপনার নেটওয়ার্ক এবং বট টোকেনটি চেক করুন।";
      }
      return res.status(504).json({ ok: false, error: errorMsg });
    }
  });
  
  app.post("/api/admin/update-permissions", async (req, res) => {
    try {
      const isAdmin = await verifyAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ error: "Access denied." });
      }

      const { userId, permissions } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
      }

      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      const token = (typeof authHeader === 'string' && authHeader.startsWith('Bearer '))
        ? authHeader.substring(7).trim()
        : '';

      const supabaseAdmin = getAdminClient(token);

      const permObj = {
        id: userId,
        ocr: (permissions || []).includes('ocr'),
        suffix_edit: (permissions || []).includes('suffix-edit'),
        rapid_fire: (permissions || []).includes('rapid-fire'),
      };

      const { error } = await supabaseAdmin
        .from('profile_permissions')
        .upsert(permObj);

      if (error) throw error;
      res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("Error in /api/admin/update-permissions:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.post("/api/admin/create-user", async (req, res) => {
    try {
      const isAdmin = await verifyAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ error: "Access denied. Only admins can create users." });
      }

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

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // 1. Create User in auth.users
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

      // 2. Upsert user into public.profiles
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

      // 3. Upsert permissions in profile_permissions
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

      res.status(200).json({
        success: true,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          displayName: displayName,
          password: finalPassword
        }
      });
    } catch (err: any) {
      console.error("Error in /api/admin/create-user:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.post("/api/admin/delete-user", async (req, res) => {
    try {
      const isAdmin = await verifyAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ error: "Access denied. Only admins can delete users." });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
      }

      if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === SUPABASE_ANON_KEY) {
        return res.status(400).json({ 
          error: "SUPABASE_SERVICE_ROLE_KEY is not configured or is set to the Anon key. Admin operations require the Service Role Key." 
        });
      }

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // 1. Delete from profiles
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.warn("Warning: Profile record deletion failed or user has no profile:", profileError.message);
      }

      // 2. Delete from auth.users (use admin client)
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteAuthError) {
        console.error("Auth user deletion failed:", deleteAuthError.message);
        return res.status(400).json({ error: deleteAuthError.message });
      }

      res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("Error in /api/admin/delete-user:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      const isAdmin = await verifyAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ error: "Access denied. Admin privileges required." });
      }

      const { userId, newPassword } = req.body;
      if (!userId || !newPassword) {
        return res.status(400).json({ error: "User ID and new password are required." });
      }

      if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === SUPABASE_ANON_KEY) {
        return res.status(400).json({ 
          error: "SUPABASE_SERVICE_ROLE_KEY is not configured or is set to the Anon key. Admin operations require the Service Role Key." 
        });
      }

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        console.error("❌ Supabase Admin resetPassword failed:", updateError);
        return res.status(400).json({ error: updateError.message });
      }

      return res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (err: any) {
      console.error("Error in /api/admin/reset-password:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.get("/api/admin/list-users", async (req, res) => {
    try {
       const isAdmin = await verifyAdmin(req);
       if (!isAdmin) {
         return res.status(403).json({ error: "Access denied." });
       }
 
       const authHeader = req.headers['authorization'] || req.headers['Authorization'];
       const token = (typeof authHeader === 'string' && authHeader.startsWith('Bearer '))
         ? authHeader.substring(7).trim()
         : '';

       const supabaseAdmin = getAdminClient(token);
 
       // Fetch profiles from DB
       const { data: profiles, error: profileError } = await supabaseAdmin
         .from('profiles')
         .select('*, profile_permissions(*)');
       
       if (profileError) throw profileError;

       // Fetch user photos
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
 
       const mergedUsers = (profiles || [])
         .map((profile: any) => {
         const perms = [];
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
           stats: { 
             generated: profile.total_generated || 0, 
             sent: profile.total_sent || 0 
           },
           createdAt: profile.created_at ? { seconds: Math.floor(new Date(profile.created_at).getTime() / 1000) } : { seconds: 0 },
           lastActive: lastSignInMap.get(profile.id)
             ? Math.floor(new Date(lastSignInMap.get(profile.id) as string).getTime() / 1000)
             : (profile.created_at ? Math.floor(new Date(profile.created_at).getTime() / 1000) : null)
         };
       });

      res.status(200).json({ users: mergedUsers });
    } catch (err: any) {
      console.error("Error in /api/admin/list-users:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // Daily "polls created" counts (last N days) for the Admin Dashboard chart
  app.get("/api/admin/poll-daily", async (req, res) => {
    try {
      const isAdmin = await verifyAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ error: "Access denied." });
      }

      const daysParam = parseInt(String(req.query.days || "30"), 10);
      const days = Number.isNaN(daysParam) ? 30 : Math.min(Math.max(daysParam, 1), 365);

      // Pre-generate zero-filled days
      const daily: { date: string; count: number }[] = [];
      const counts = new Map<string, number>();
      for (let i = days - 1; i >= 0; i--) {
        const key = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
        daily.push({ date: key, count: 0 });
        counts.set(key, 0);
      }

      try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        const token = (typeof authHeader === 'string' && authHeader.startsWith('Bearer '))
          ? authHeader.substring(7).trim()
          : '';

        const supabaseAdmin = getAdminClient(token);

        const sinceIso = new Date(Date.now() - (days - 1) * 24 * 3600 * 1000).toISOString();
        let { data: rows, error } = await supabaseAdmin
          .from('poll_questions')
          .select('created_at')
          .gte('created_at', sinceIso);

        if (error && error.message?.includes('created_at')) {
          const fallback = await supabaseAdmin
            .from('poll_questions')
            .select('updated_at')
            .gte('updated_at', sinceIso);
          rows = (fallback.data || []).map((r: any) => ({ created_at: r.updated_at }));
          error = fallback.error;
        }

        if (!error && rows) {
          rows.forEach((row: any) => {
            const dt = row?.created_at || row?.updated_at;
            if (!dt) return;
            const key = new Date(dt).toISOString().slice(0, 10);
            if (counts.has(key)) {
              counts.set(key, (counts.get(key) || 0) + 1);
            }
          });

          daily.forEach(d => {
            d.count = counts.get(d.date) || 0;
          });
        }
      } catch (queryErr) {
        console.warn("Could not query poll_questions for daily stats:", queryErr);
      }

      return res.status(200).json({ days: daily });
    } catch (err: any) {
      console.error("Error in /api/admin/poll-daily:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.post("/api/admin/save-config", async (req, res) => {
    try {
      const isAdmin = await verifyAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ error: "Access denied." });
      }

      const { key, value } = req.body;
      console.log("Saving config with body:", req.body);
      if (!key) {
        return res.status(400).json({ error: "Key is required." });
      }

      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      const token = (typeof authHeader === 'string' && authHeader.startsWith('Bearer '))
        ? authHeader.substring(7).trim()
        : '';

      const supabaseAdmin = getAdminClient(token);

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
        console.error("Supabase upsert error:", error);
        throw error;
      }
      
      res.status(200).json({ success: true, data: data || [] });
    } catch (err: any) {
      console.error("Error in /api/admin/save-config:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.get("/api/app-config", async (req, res) => {
    try {
      const keyToUse = SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      if (!keyToUse || !SUPABASE_URL) {
        return res.json({
          default_suffix: 'Join: https://t.me/SOT_Academy',
          updated_by: 'System',
          updated_at: new Date().toISOString()
        });
      }

      const supabaseAdmin = createClient(SUPABASE_URL, keyToUse, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { data, error } = await supabaseAdmin
        .from('system_config')
        .select('updated_by, default_suffix, updated_at')
        .eq('key', 'config')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (!data) {
        return res.json({
          default_suffix: 'Join: https://t.me/SOT_Academy',
          updated_by: 'System',
          updated_at: new Date().toISOString()
        });
      }

      if (data.default_suffix === null || data.default_suffix === undefined) {
          data.default_suffix = 'Join: https://t.me/SOT_Academy';
      }

      res.json(data);
    } catch (err: any) {
      console.error("Error in /api/app-config:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Frontend server started (Bot is now handled via Vercel Webhook)");
  });
}

startServer();
