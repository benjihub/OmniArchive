export type AIPlatform = 'chatgpt' | 'claude' | 'gemini';
export type MessageRole = 'user' | 'assistant' | 'system';

export type RichContentBlock =
  | { type: 'paragraph' | 'blockquote' | 'math'; text: string }
  | { type: 'heading'; text: string; level: number }
  | { type: 'code'; text: string; language?: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'image'; alt: string; src?: string };

export interface MessageNode {
  id: string;
  threadId: string;
  role: MessageRole;
  content: string;
  blocks?: RichContentBlock[];
  externalMessageId?: string;
  sequence?: number;
  timestamp: number;
}

export interface Thread {
  id: string; 
  platform: AIPlatform;
  externalThreadId: string;
  title: string;
  url: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  folderId?: string;
  origin?: 'capture' | 'import';
}

export interface VaultFolder {
  id: string;
  name: string;
  parentId?: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface PromptTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  usageCount: number;
  updatedAt: number;
  isFavorite?: boolean;
}

export interface CaptureStatus {
  state: "scanning" | "waiting" | "saving" | "saved" | "error";
  platform: AIPlatform;
  updatedAt: number;
  messageCount?: number;
  detail?: string;
  url?: string;
}
