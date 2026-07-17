// Shared chat types used by the UI and the /api/chat request payload.

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  // True for the compiled answers a questionnaire sent on the user's behalf.
  // The message stays in the conversation — the model needs it, and the
  // answered card re-reads it to highlight the chosen options — but it is
  // never rendered as a chat bubble: the questionnaire itself already shows
  // the answers.
  hidden?: boolean;
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
