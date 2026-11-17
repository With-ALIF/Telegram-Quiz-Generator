import { TelegramSettings } from "../../../types";

export const getEffectiveSettings = (settings: TelegramSettings, chatId: string, botToken: string, user: any, canEditSuffix: boolean = true, globalDefaultSuffix?: string) => {
  let cp = settings.questionPrefix || '';
  let cs = settings.explanationSuffix || '';
  
  const fallbackSuffix = '📱 Join Telegram';
  const effectiveGlobalSuffix = globalDefaultSuffix || fallbackSuffix;

  // If user cannot edit suffix, always force the global default suffix
  if (!canEditSuffix) {
    cs = effectiveGlobalSuffix;
  }

  const ch = settings.channels?.find(c => c.id === chatId);
  if (ch) {
    if (ch.activePrefixId === 'none') {
      cp = '';
    } else if (ch.activePrefixId) {
      const foundPrefix = settings.prefixes?.find(p => p.id === ch.activePrefixId)?.content;
      if (foundPrefix !== undefined) cp = foundPrefix;
    }
    
    if (canEditSuffix) {
      if (ch.activeSuffixId === 'none') {
        cs = '';
      } else if (ch.activeSuffixId) {
        const foundSuffix = settings.suffixes?.find(s => s.id === ch.activeSuffixId)?.content;
        if (foundSuffix !== undefined) {
          cs = foundSuffix;
        }
      }
    }
  }
  
  return { ...settings, botToken, questionPrefix: cp, explanationSuffix: cs };
};
