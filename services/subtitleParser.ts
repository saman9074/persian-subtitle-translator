
import { SubtitleEntry } from '../types';

export const parseSrt = (srtContent: string): SubtitleEntry[] => {
  const entries: SubtitleEntry[] = [];
  const lines = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  let i = 0;

  while (i < lines.length) {
    const idLine = lines[i]?.trim();

    if (!idLine) { // Skip empty lines that might be at the start or between entries
      i++;
      continue;
    }
    
    const id = parseInt(idLine, 10);
    // Check if id is a valid number. If not, it might be part of text or malformed.
    if (isNaN(id) || i + 1 >= lines.length || !lines[i+1]?.includes('-->')) {
        // This heuristic tries to recover if an ID line is missing or malformed,
        // by assuming current line is text if next is not timestamp.
        // Or, if it's the very end and malformed.
        // For robust parsing, a more stateful machine or regex might be better.
        // console.warn(`Skipping potentially malformed SRT section starting with: ${idLine}`);
        i++; // Advance to try and find the next valid block
        continue;
    }

    i++; // Advance to time line
    const timeLine = lines[i]?.trim();
    if (!timeLine || !timeLine.includes('-->')) {
      // console.warn(`Invalid or missing time line for ID ${id}: ${timeLine}`);
      i++; // Skip this supposed entry
      continue;
    }
    const timeParts = timeLine.split('-->');
    if (timeParts.length !== 2) {
        // console.warn(`Malformed time line for ID ${id}: ${timeLine}`);
        i++;
        continue;
    }
    const [startTime, endTime] = timeParts.map(s => s.trim());

    i++; // Advance to text lines
    let textBlock: string[] = [];
    while (i < lines.length && lines[i]?.trim() !== '') {
      textBlock.push(lines[i].trim());
      i++;
    }
    
    if (textBlock.length > 0) {
      entries.push({
        id,
        startTime,
        endTime,
        text: textBlock.join('\n'),
      });
    } else {
    //   console.warn(`No text found for subtitle ID ${id}`);
    }

    // After processing text, `lines[i]` is either an empty line or undefined (EOF).
    // If it's an empty line, advance past it to the start of the next entry.
    if (i < lines.length && lines[i]?.trim() === '') {
      i++;
    }
    // If it's EOF or next line is content, loop will handle it.
  }
  return entries;
};

export const parseVtt = (vttContent: string): SubtitleEntry[] => {
  const entries: SubtitleEntry[] = [];
  const lines = vttContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  let i = 0;
  let idCounter = 1; // VTT cues might not have numeric IDs or any ID, so we generate sequential ones.

  // Skip WEBVTT header and any initial non-cue lines (comments, metadata)
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith('WEBVTT')) {
      i++;
      continue;
    }
    // If it's not a comment, and not empty, it might be the start of cues or an unhandled line.
    // We break to start looking for cues. If it's a comment or empty, we skip.
    if (!line.startsWith('NOTE') && line !== '') {
        break; 
    }
    i++;
  }


  while (i < lines.length) {
    let currentLine = lines[i]?.trim();

    // Skip blank lines and NOTE comments between cues
    while (i < lines.length && (currentLine === '' || currentLine.startsWith('NOTE'))) {
      i++;
      if (i < lines.length) {
        currentLine = lines[i]?.trim();
      } else {
        break;
      }
    }

    if (i >= lines.length || !currentLine) break; // End of file or only blank lines left

    // A VTT cue can have an optional identifier line before the timestamp.
    // We will ignore it for now and use our sequential idCounter.
    // The crucial part is finding the timestamp line.
    let timeLine = null;
    let textStartIndex = i;

    // Check if currentLine or next line is a timestamp
    if (currentLine.includes('-->')) {
        timeLine = currentLine;
        textStartIndex = i + 1;
    } else if (i + 1 < lines.length && lines[i+1]?.includes('-->')) {
        // Assuming currentLine is a VTT cue identifier
        timeLine = lines[i+1].trim();
        textStartIndex = i + 2;
    } else {
        // Cannot find a timestamp, might be malformed or end of useful content
        // console.warn(`Expected VTT timestamp, found: ${currentLine}`);
        i++; // Move to next line and try again
        continue;
    }
    
    const timeParts = timeLine.split('-->');
    if (timeParts.length !== 2) {
      // console.warn(`Malformed VTT time line: ${timeLine}`);
      i = textStartIndex; // Move past this malformed attempt
      continue;
    }
    // VTT timestamps use '.' for milliseconds. Ensure this.
    const [startTime, endTime] = timeParts.map(s => s.trim().replace(',', '.'));

    const textBlock: string[] = [];
    i = textStartIndex;
    while (i < lines.length && lines[i]?.trim() !== '') {
      const textLine = lines[i].trim();
      // Also ignore NOTE lines that might appear within the text payload (though unusual)
      if (!textLine.startsWith('NOTE')) {
          textBlock.push(textLine);
      }
      i++;
    }

    if (textBlock.length > 0) {
      entries.push({
        id: idCounter++,
        startTime,
        endTime,
        text: textBlock.join('\n'),
      });
    } else {
    //   console.warn(`No text found for VTT cue after timestamp: ${timeLine}`);
    }
    // `i` is now at the blank line after the cue or EOF
    // The main loop's blank line skipping will handle advancing `i` correctly.
  }
  return entries;
};
