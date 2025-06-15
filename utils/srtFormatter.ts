import { SubtitleEntry } from '../types';

export const formatSrt = (subtitles: SubtitleEntry[]): string => {
  return subtitles
    .map(entry => {
      // Use translated text if available, otherwise fallback to original (or a placeholder)
      const textToUse = entry.translatedText || entry.text;
      // SRT standard uses comma for milliseconds separator
      const startTime = entry.startTime.replace('.', ',');
      const endTime = entry.endTime.replace('.', ',');
      return `${entry.id}\n${startTime} --> ${endTime}\n${textToUse}\n`;
    })
    .join('\n'); // Each entry already ends with a newline, join with one more for separation
};
