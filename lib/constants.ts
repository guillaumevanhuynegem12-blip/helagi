// Client-visible limits. The server enforces its own copy of these caps in
// app/api/chat/route.ts — the UI limit is convenience, not security.
export const MAX_INPUT_CHARS = 4000;

export const EXAMPLE_PROMPTS = [
  "My knee is swollen and it hurts to walk",
  "I have a headache that won't go away",
  "My child has a fever — should I see a doctor?",
  "I've been feeling tired all the time lately",
];

export const DISCLAIMER =
  "Helagi gives general health information, not medical advice. For a diagnosis or treatment, please see a doctor.";

// Invisible marker the model appends when a reply fully wraps up the
// conversation (see <session_end_signal> in lib/systemPrompt.ts). The UI
// strips it from display/storage and uses it to time the "Have you finished
// this session?" prompt.
export const SESSION_END_MARKER = "[[SESSION_MAYBE_OVER]]";

// Invisible marker the model puts between a finished answer and a trailing
// selectable question (e.g. the recovery/care plan offer — see
// <recovery_plans> in lib/systemPrompt.ts). ChatApp splits the reply into a
// separate assistant message at the marker so the question reliably renders
// as clickable buttons in its own bubble.
export const NEW_MESSAGE_MARKER = "[[NEW_MESSAGE]]";
