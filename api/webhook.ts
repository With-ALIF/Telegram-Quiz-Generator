import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

let cachedBot: TelegramBot | null = null;
let lastUsedToken: string | null = null;

function getBot(): TelegramBot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) return null;
  if (!cachedBot || lastUsedToken !== token) {
    cachedBot = new TelegramBot(token);
    lastUsedToken = token;
  }
  return cachedBot;
}

const welcomeMessage = (chatId: string) => `*TeleQuiz AI Platform*
_Smart & Instant Telegram Quiz Generator_

আপনার যেকোনো পড়ার নোট, আর্টিকেল বা প্রশ্নমালা থেকে সেকেন্ডেই নির্ভুল কুইজ তৈরি করে সরাসরি আপনার Telegram চ্যানেল ও গ্রুপে Poll আকারে পাবলিশ করুন।

━━━━━━━━━━━━━━━━━━━━━
*আপনার Chat ID:* \`${chatId}\`
_(আইডিটিতে চাপ দিয়ে কপি করে Web App-এর Settings-এ যুক্ত করুন)_
━━━━━━━━━━━━━━━━━━━━━

*মূল সুবিধাসমূহ (Features):*
• *AI Quiz Maker:* AI দিয়ে স্বয়ংক্রিয় MCQ ও সঠিক উত্তর জেনারেশন
• *Direct Poll Dispatch:* টেলিগ্রামে সিঙ্গেল বা একসাথে সব কুইজ পাঠানোর সুবিধা
• *Real-Time Sync:* ড্রাফট সংরক্ষণ ও রিয়েল-টাইম স্ট্যাটাস ট্র্যাকিং
• *Branding Control:* নিজস্ব প্রিফিক্স ও কাস্টম সাফিক্স যুক্ত করার সুযোগ

*শুরু করতে নিচের "Visit Website" বাটনে ট্যাপ করুন।*
যেকোনো সহায়তার জন্য সরাসরি অ্যাডমিনের সাথে যোগাযোগ করতে পারেন।`;

const defaultKeyboard = {
  inline_keyboard: [
    [
      { text: 'Visit Website', url: 'https://poll.mnr.bd' }
    ],
    [
      { text: 'Admin Support', url: 'https://t.me/ALIF1230' }
    ]
  ]
};

export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const bot = getBot();
    if (!bot) {
      console.error("TELEGRAM_BOT_TOKEN environment variable is missing.");
      return res.status(500).send("TELEGRAM_BOT_TOKEN is missing");
    }
    try {
      const update = req.body;
      console.log("Webhook update:", JSON.stringify(update));
      const msg = update.message || update.channel_post;
      console.log("Msg:", JSON.stringify(msg));
      
      if (msg && (msg.text || msg.caption)) {
        const text = (msg.text || msg.caption)!.trim();
        const chatId = msg.chat.id.toString();
        console.log(`Received message from ${chatId}: ${text}`);

        if (text.startsWith('/start')) {
          await bot.sendMessage(chatId, welcomeMessage(chatId), { 
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: defaultKeyboard
          });
        } else if (text.toLowerCase().startsWith('/id') || text.toLowerCase().startsWith('/chatid')) {
          await bot.sendMessage(chatId, `*আপনার Chat ID:* \`${chatId}\`\n\nএটি কপি করে Web App-এর Settings-এ যুক্ত করুন।`, { 
            parse_mode: 'Markdown',
            reply_markup: defaultKeyboard
          });
        } else if (text.toLowerCase().startsWith('/help')) {
          await bot.sendMessage(chatId, `*TeleQuiz AI Help & Support*\n\n• ওয়েবসাইট ভিজিট করতে: https://poll.mnr.bd\n• আপনার Chat ID পেতে: \`/id\`\n• অ্যাডমিনের সাথে যোগাযোগ করতে: @ALIF1230`, {
            parse_mode: 'Markdown',
            reply_markup: defaultKeyboard
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    res.status(200).send('OK');
  } else {
    res.status(200).send('Webhook is active');
  }
}
