import type { AllQuestions, Answer } from './types';
import csvText from './assets/questions.csv?raw';

export function parseCSV(csv: string): AllQuestions {
  const result: AllQuestions = {};

  const lines = csv
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  for (const line of lines) {
    // Format: questionNumber,answerText,points
    const firstComma = line.indexOf(',');
    const lastComma = line.lastIndexOf(',');

    if (firstComma === -1 || lastComma === firstComma) continue;

    const qNum = parseInt(line.substring(0, firstComma), 10);
    const text = line.substring(firstComma + 1, lastComma).trim();
    const points = parseInt(line.substring(lastComma + 1).trim(), 10);

    if (isNaN(qNum) || isNaN(points)) continue;

    if (!result[qNum]) result[qNum] = [];

    const answer: Answer = {
      id: `q${qNum}-a${result[qNum].length + 1}`,
      text,
      points,
      revealed: false,
    };

    result[qNum].push(answer);
  }

  return result;
}

/** Pre-parsed at module load time (no async needed with ?raw import). */
export const allQuestionsData: AllQuestions = parseCSV(csvText);
