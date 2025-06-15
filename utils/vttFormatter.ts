import { SubtitleEntry } from '../types';

export const formatVtt = (subtitles: SubtitleEntry[]): string => {
  const header = "WEBVTT\n\n";
  const cues = subtitles
    .map(entry => {
      const textToUse = entry.translatedText || entry.text;
      // VTT standard uses period for milliseconds separator
      const startTime = entry.startTime.replace(',', '.');
      const endTime = entry.endTime.replace(',', '.');
      
      // VTT cues don't typically have numeric IDs like SRT, but can have identifiers.
      // For simplicity, we're not adding IDs here, but they could be entry.id if desired.
      // Cue text follows immediately after the timestamp line.
      return `${startTime} --> ${endTime}\n${textToUse}`;
    })
    .join('\n\n'); // Cues are separated by two newlines (one blank line)
  return header + cues;
};
