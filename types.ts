export enum ReactionId {
  Sense = 'sense', // Good Sense
  Fukai = 'fukai', // Deep
}

export interface Reaction {
  id: ReactionId;
  label: string;
  icon: React.ReactNode;
  count: number;
  isReacted: boolean;
}

export enum Visibility {
  Public = 'public',
  Limited = 'limited',
  Private = 'private',
}

export interface User {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string;
  bio?: string;
}

export interface HaikuPost {
  id: string;
  author: string;
  authorAvatar: string;
  line1: string;
  line2: string;
  line3: string;
  image?: string;
  reactions: Reaction[];
  timestamp: number;
  visibility: Visibility;
  isAiGenerated: boolean;
  replyToId?: string;
  quotedPostId?: string;
}