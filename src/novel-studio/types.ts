export type CodexType = "character" | "location" | "object" | "lore" | "subplot" | "other";
export type SaveState = "idle" | "modified" | "saving" | "saved" | "error" | "conflict";

export interface WorkspaceManifest {
  schemaVersion: 1;
  workspaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  novels: Array<{ id: string; title: string; archived: boolean; updatedAt: string }>;
}

export interface WorkspacePreferences {
  schemaVersion: 1;
  lastNovelId: string | null;
  lastBackupAt: string | null;
  editor: Record<string, unknown>;
  ai: {
    provider: "openai" | "ollama" | "chatgpt-manual";
    enabled: boolean;
    apiKey: string;
    model: string;
    ollamaUrl: string;
    ollamaModel: string;
    manualUrl: string;
  };
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  synopsis: string;
  genre: string;
  language: string;
  wordGoal: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SceneMetadata {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  beats: string[];
  povId: string | null;
  status: string;
  temporal: string;
  labels: string[];
  subplots: string[];
  wordCount: number;
  contentHash: string;
  updatedAt: string;
  archived: boolean;
}

export interface Chapter { id: string; title: string; numbered: boolean; archived: boolean; sceneIds: string[] }
export interface Act { id: string; title: string; numbered: boolean; archived: boolean; chapters: Chapter[] }
export interface StoryStructure { schemaVersion: 1; acts: Act[]; scenes: Record<string, SceneMetadata> }

export interface CodexProgression { id: string; sceneId: string; text: string; createdAt: string }
export interface CodexEntry {
  id: string;
  type: CodexType;
  name: string;
  aliases: string[];
  categories: string[];
  details: Record<string, string>;
  relations: string[];
  progressions: CodexProgression[];
  trackMentions: boolean;
  caseSensitive: boolean;
  exclusions: string[];
  archived: boolean;
  updatedAt: string;
}

export interface Revision {
  schemaVersion: 1;
  id: string;
  entityId: string;
  entityType: "scene" | "codex";
  reason: string;
  createdAt: string;
  pinned: boolean;
  content: string;
  metadata: unknown;
}

export interface WorkspaceFileConflict {
  path: string;
  expectedHash: string;
  actualHash: string;
  diskContent: string;
  localContent: string;
}
