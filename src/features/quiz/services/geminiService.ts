import { QuizQuestion } from "../../../types";

/**
 * Fast local parser for formatted MCQ text (Bengali or English).
 * Instantly extracts questions without network latency if the input is already in standard MCQ format.
 */
function tryParseLocalMCQs(text: string, preserveBoardInfo: boolean): Omit<QuizQuestion, 'id' | 'status'>[] | null {
  try {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 5) return null;

    const optRegex = /^\s*(?:[\(\[\{]?([কখগঘabcdABCD1234])[\)\]\}]?[\.\:\-\s]+|\(([কখগঘabcdABCD1234])\)\s*)(.*)$/;
    const ansRegex = /^\s*(?:উত্তর|উঃ|উ:|সঠিক\s*উত্তর|Ans(?:wer)?|Correct(?:\s*Answer)?)\s*[:\-\s]+(.*)$/i;
    const qNumRegex = /^\s*(?:(?:প্রশ্ন|Q|Question)\s*)?([০-৯\d]+)[\.\)\:\-\s]+(.*)$/i;

    const questions: Omit<QuizQuestion, 'id' | 'status'>[] = [];
    let currentQ: string = '';
    let currentOpts: string[] = [];
    let correctIdx: number = 0;
    let foundAns = false;
    let explanation = '';

    const finalizeCurrent = () => {
      if (currentQ && currentOpts.length >= 2) {
        let qText = currentQ.trim();
        if (!preserveBoardInfo) {
          qText = qText.replace(/\[\s*(.*?বোর্ড|.*?বো\.|.*?board|.*?university|.*?varsity|.*?\d{4}.*?)\s*\]/gi, '').trim();
          qText = qText.replace(/\[[^\]]+\]\s*$/, '').trim();
        }

        const finalOpts = [...currentOpts];
        while (finalOpts.length < 4) {
          finalOpts.push(`Option ${finalOpts.length + 1}`);
        }
        if (finalOpts.length > 4) {
          finalOpts.length = 4;
        }

        questions.push({
          question: qText.substring(0, 250),
          options: finalOpts.slice(0, 4).map(o => o.substring(0, 90)),
          correctOptionIndex: (correctIdx >= 0 && correctIdx < 4) ? correctIdx : 0,
          explanation: explanation.substring(0, 150)
        });
      }
      currentQ = '';
      currentOpts = [];
      correctIdx = 0;
      foundAns = false;
      explanation = '';
    };

    const optMap: Record<string, number> = {
      'ক': 0, 'খ': 1, 'গ': 2, 'ঘ': 3,
      'a': 0, 'b': 1, 'c': 2, 'd': 3,
      'A': 0, 'B': 1, 'C': 2, 'D': 3,
      '1': 0, '2': 1, '3': 2, '4': 3,
      '১': 0, '২': 1, '৩': 2, '৪': 3
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const ansMatch = line.match(ansRegex);
      if (ansMatch) {
        foundAns = true;
        const ansRaw = ansMatch[1].trim();
        const firstChar = ansRaw.charAt(0);
        if (optMap[firstChar] !== undefined) {
          correctIdx = optMap[firstChar];
        } else {
          const found = currentOpts.findIndex(o => o.trim() === ansRaw);
          if (found !== -1) {
            correctIdx = found;
          }
        }
        continue;
      }

      const expMatch = line.match(/^\s*(?:ব্যাখ্যা|Explanation|Note)\s*[:\-\s]+(.*)$/i);
      if (expMatch) {
        explanation = expMatch[1].trim();
        continue;
      }

      const optMatch = line.match(optRegex);
      if (optMatch && currentQ) {
        const optText = (optMatch[3] || '').trim();
        if (optText && currentOpts.length < 4) {
          currentOpts.push(optText);
          continue;
        }
      }

      const qMatch = line.match(qNumRegex);
      if (qMatch && (!currentQ || currentOpts.length >= 2 || foundAns)) {
        finalizeCurrent();
        currentQ = qMatch[2] ? qMatch[2].trim() : line;
        continue;
      }

      if (!currentQ) {
        currentQ = line;
      } else if (currentOpts.length === 0) {
        currentQ += ' ' + line;
      }
    }

    finalizeCurrent();

    if (questions.length > 0) {
      console.log(`[geminiService] Fast local parser successfully extracted ${questions.length} questions instantly!`);
      return questions;
    }
  } catch (err) {
    console.warn("[geminiService] Local MCQ parser error, falling back to API:", err);
  }
  return null;
}

export async function generateQuizFromText(text: string, count: number = 5, preserveBoardInfo: boolean = true, retries: number = 3): Promise<Omit<QuizQuestion, 'id' | 'status'>[]> {
  // 1. Try local JSON parsing first
  try {
    const trimmedText = text.trim();
    if (trimmedText.startsWith('[') || trimmedText.startsWith('{')) {
      const parsed = JSON.parse(trimmedText);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      if (items.length > 0 && (items[0].question || items[0].q)) {
        console.log("Successfully detected and parsed raw JSON input locally", items);
        return items.map((item: any) => {
          let qText = item.question || item.q || '';
          
          if (!preserveBoardInfo) {
            qText = qText.replace(/\[\s*(.*?বোর্ড|.*?বো\.|.*?board|.*?university|.*?varsity|.*?\d{4}.*?)\s*\]/gi, '').trim();
            qText = qText.replace(/\[[^\]]+\]\s*$/, '').trim();
          }

          let opts: string[] = [];
          if (Array.isArray(item.options)) opts = item.options;
          else if (Array.isArray(item.choices)) opts = item.choices;
          else if (Array.isArray(item.answers)) opts = item.answers;
          
          if (opts.length < 4) {
            while (opts.length < 4) {
              opts.push(`Option ${opts.length + 1}`);
            }
          } else if (opts.length > 4) {
            opts = opts.slice(0, 4);
          }

          let correctIdx = 0;
          if (typeof item.correctOptionIndex === 'number') {
            correctIdx = item.correctOptionIndex;
          } else if (typeof item.correct_index === 'number') {
            correctIdx = item.correct_index;
          } else if (item.answer !== undefined) {
            const ansStr = String(item.answer).trim();
            const foundIdx = opts.findIndex(o => o.trim() === ansStr);
            if (foundIdx !== -1) {
              correctIdx = foundIdx;
            } else {
              const parsedIdx = parseInt(ansStr);
              if (!isNaN(parsedIdx)) {
                correctIdx = parsedIdx >= 1 && parsedIdx <= 4 ? parsedIdx - 1 : parsedIdx;
              }
            }
          }

          if (correctIdx < 0 || correctIdx > 3 || isNaN(correctIdx)) {
            correctIdx = 0;
          }

          const explanation = item.explanation || item.explain || item.desc || '';

          return {
            question: qText.substring(0, 250),
            options: opts.map(o => String(o).substring(0, 90)),
            correctOptionIndex: correctIdx,
            explanation: explanation.substring(0, 150)
          };
        });
      }
    }
  } catch (jsonErr) {
    // If JSON parsing fails, continue
  }

  // 2. Try fast local MCQ text parser for preformatted questions
  const localQuestions = tryParseLocalMCQs(text, preserveBoardInfo);
  if (localQuestions && localQuestions.length > 0) {
    return localQuestions;
  }

  // 3. Fall back to high-speed Gemini API
  try {
    const response = await fetch("/api/quiz/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, count, preserveBoardInfo }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error("Error generating quiz from text via API:", err);
    throw err;
  }
}

export async function generateQuizFromImage(imageBase64: string, mimeType: string, count: number = 5, retries: number = 3): Promise<Omit<QuizQuestion, 'id' | 'status'>[]> {
  try {
    const response = await fetch("/api/quiz/generateFromImage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageBase64, mimeType, count }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error("Error generating quiz from image via API:", err);
    throw err;
  }
}
