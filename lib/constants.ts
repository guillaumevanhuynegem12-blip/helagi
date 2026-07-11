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
