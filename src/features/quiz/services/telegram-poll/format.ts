import { QuizQuestion, TelegramSettings } from "../../../../types";

export function formatQuestionText(question: QuizQuestion, settings: TelegramSettings): string {
  let finalQuestion = (question.question || '').trim();
  const prefix = settings.questionPrefix?.trim();
  
  if (prefix && !finalQuestion.startsWith(prefix)) {
    finalQuestion = `${prefix}\n${finalQuestion}`;
  }
  if (finalQuestion.length > 300) return finalQuestion.substring(0, 297) + '...';
  return finalQuestion;
}

export function formatExplanationText(question: QuizQuestion, settings: TelegramSettings): string {
  let finalExplanation = (question.explanation || '').trim();
  const suffix = settings.explanationSuffix?.trim();

  // Strip known existing suffixes if present, so updating suffix does not accumulate old versions
  const knownOldSuffixes = new Set<string>();
  if (settings.suffixes) {
    settings.suffixes.forEach(s => {
      if (s.content?.trim()) knownOldSuffixes.add(s.content.trim());
    });
  }
  knownOldSuffixes.add('Join: https://t.me/SOT_Academy');
  knownOldSuffixes.add('join: https://t.me/SOT_Academy');
  knownOldSuffixes.add('📱 Join Telegram');

  for (const oldSuf of knownOldSuffixes) {
    if (oldSuf && oldSuf !== suffix && finalExplanation.includes(oldSuf)) {
      finalExplanation = finalExplanation.replace(oldSuf, '').trim();
    }
  }

  // Also remove common trailing Telegram join patterns if different from current suffix
  const lines = finalExplanation.split('\n');
  if (lines.length > 1) {
    const lastLine = lines[lines.length - 1].trim();
    if (
      lastLine && 
      lastLine !== suffix && 
      (lastLine.startsWith('📱') || lastLine.toLowerCase().includes('t.me/') || lastLine.toLowerCase().startsWith('join:'))
    ) {
      lines.pop();
      finalExplanation = lines.join('\n').trim();
    }
  }

  finalExplanation = finalExplanation.replace(/\n{3,}/g, '\n\n').trim();
  
  if (suffix && !finalExplanation.includes(suffix)) {
    finalExplanation = finalExplanation ? `${finalExplanation}\n\n${suffix}` : suffix;
  }
  
  if (finalExplanation.length > 200) return finalExplanation.substring(0, 197) + '...';
  return finalExplanation;
}
