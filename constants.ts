
export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
// Add other allowed text models here if they become available
export const AVAILABLE_TEXT_MODELS = [GEMINI_MODEL_NAME] as const;

export const DEFAULT_CONTEXT_WINDOW_SIZE = 4; // Default number of lines before and after for context

export const SUBTITLE_SUBJECTS = [
  'Film',
  'TV Series',
  'Music Video',
  'General Education',
  'Specialized Education',
  'Specialized Programming Education',
  'Specialized Computer Education',
  'Documentary',
] as const;

export type SubtitleSubjectType = typeof SUBTITLE_SUBJECTS[number];
