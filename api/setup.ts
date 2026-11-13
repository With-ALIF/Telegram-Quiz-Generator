import TelegramBot from 'node-telegram-bot-api';

export default async function handler(req: any, res: any) {
  const host = req.headers?.host || 'poll.mnr.bd';
  // Telegram webhooks REQUIRE https
  const url = `https://${host}/api/webhook`;
  
  const token = (req.query?.token as string) || 
    process.env.TELEGRAM_BOT_TOKEN || 
    process.env.VITE_TELEGRAM_BOT_TOKEN || 
    process.env.BOT_TOKEN || 
    "8783681142:AAE-1mDudEvYuT3RTRjg8h6ZzkLcIgKTM1Q";
  
  if (!token) {
    return res.status(500).send("❌ Error: TELEGRAM_BOT_TOKEN environment variable is not defined.\n\nTip: You can also pass it in the URL: https://poll.mnr.bd/api/setup?token=YOUR_BOT_TOKEN");
  }
  
  try {
    const bot = new TelegramBot(token);
    await bot.setWebHook(url);
    res.status(200).send(`✅ Webhook successfully set to: ${url}\n\nএখন আপনার বট 24/7 চালু থাকবে!`);
  } catch (error: any) {
    res.status(500).send(`❌ Error setting webhook: ${error.message}`);
  }
}
