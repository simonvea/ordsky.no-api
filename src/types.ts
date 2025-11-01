// Message types for WebSocket communication
export interface ServerToClientEvents {
  WORDS_ADDED: (response: WordsAddedResponse) => void;
  CLOUD_CREATED: (response: CloudCreatedResponse) => void;
  SESSION_WORDS: (response: SessionWordsResponse) => void;
  ERROR: (response: ErrorResponse) => void;
  SESSION_STARTED: (response: SessionWordsResponse) => void;
  SESSION_REJOINED: (response: SessionRejoinedResponse) => void;
  USER_JOINED: (response: UserJoinedResponse) => void;
}

export interface ClientToServerEvents {
  startsession: (message: { id: string }) => void;
  savewords: (message: { id: string; words: string[] }) => void;
  getwords: (message: { id: string }) => void;
  savecloud: (message: { id: string; cloud: any; wordCount: number }) => void;
  rejoinsession: (message: { id: string }) => void;
}

// Response message types
export interface WordsAddedResponse {
  type: "WORDS_ADDED";
  numberOfEntries: number;
  connectionCount?: number;
  newWordsCount?: number;
}

export interface CloudCreatedResponse {
  type: "CLOUD_CREATED";
  cloud: any;
  wordCount: number;
  connectionCount?: number;
  sessionId?: string;
}

export interface SessionWordsResponse {
  type: "SESSION_WORDS";
  words: string[];
  numberOfEntries: number;
}

export interface ErrorResponse {
  type: "ERROR";
  message: string;
}

export interface SessionStartedResponse {
  type: "SESSION_STARTED";
  message: string;
  sessionId: string;
  numberOfEntries: number;
  connectionCount: number;
}

export interface SessionRejoinedResponse {
  type: "SESSION_REJOINED";
  message: string;
  sessionId: string;
  numberOfEntries: number;
  connectionCount: number;
  words: string[];
  cloud?: any;
  wordCount?: number;
}

export interface UserJoinedResponse {
  type: "USER_JOINED";
  connectionCount: number;
}

// Session data structure
export interface SessionData {
  id: string;
  numberOfEntries: number;
  words: string[];
  cloud?: any;
  wordCount?: number;
  createdAt: Date;
}

