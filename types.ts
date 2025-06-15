import { SUBTITLE_SUBJECTS } from './constants';

export interface SubtitleEntry {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
  translatedText?: string;
}

export enum ProcessingState {
  IDLE,
  PARSING,
  TRANSLATING,
  DONE,
  ERROR
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: GroundingChunkWeb;
}

export type SubtitleSubject = typeof SUBTITLE_SUBJECTS[number];
