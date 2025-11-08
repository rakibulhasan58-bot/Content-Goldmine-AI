export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export type Day = typeof DAYS[number];

export interface ContentIdea {
  id: string;
  title: string;
  outline?: string;
  summary?: string;
  fullContent?: string;
  isDraft?: boolean;
  imageUrl?: string;
  videoUrl?: string;
}

export interface ScheduledItem {
  id: string;
  idea: ContentIdea;
  day: Day;
  time?: string;
}

export interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
}