// Shared chat types used by the UI and the /api/chat request payload.

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  // True once the visitor completed the feedback survey for this conversation
  // (asked when they say the session is finished, and required before the
  // doctor summary unlocks). Persists with account chat history.
  surveyDone?: boolean;
}
