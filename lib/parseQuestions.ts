// Detects the triage questionnaire in an assistant message: numbered questions
// followed by an "Options: A / B / C" line (per the system prompt's format).
// Returns the questions plus the message text with those blocks removed, so the
// UI can render clickable buttons instead of raw text.

export interface ParsedQuestion {
  number: number;
  text: string;
  /** null = free-text question (no Options line) */
  options: string[] | null;
}

export interface ParsedTriage {
  /** message content with the question blocks stripped out */
  stripped: string;
  questions: ParsedQuestion[];
}

const QUESTION_RE = /^\s*(\d+)[.)]\s+(.+)$/;
const OPTIONS_RE =
  /^\s*\**\s*(?:Options?|Answers?|Choices?|Select one)\s*\**\s*:\s*(.+)$/i;
// options tucked into the question line itself, e.g. "1. Fever? (Yes / No)"
const INLINE_OPTIONS_RE = /\(([^()]*\/[^()]*)\)\s*\**\s*$/;
// question and options crammed onto one line, e.g.
// "Would you like a care plan? Options: Yes, please / No, thanks"
const OPTIONS_SUFFIX_RE =
  /^(.*\?)\s*\**\s*(?:Options?|Answers?|Choices?)\s*\**\s*:\s*(.+)$/i;

function cleanLabel(s: string): string {
  return s.replace(/\*\*/g, "").trim();
}

// Fallback numbering for questions the model forgot to number.
function nextNumber(questions: ParsedQuestion[]): number {
  return questions.reduce((max, q) => Math.max(max, q.number), 0) + 1;
}

function splitOptions(s: string): string[] {
  return s
    .split(/\s*[/|]\s*/)
    .map(cleanLabel)
    .filter((o) => o.length > 0 && o.length <= 40);
}

// Recovers the user's answers from the compiled reply that QuestionCard sent
// ("1. Question text — Yes" per line, or "Question text — Yes" for a single
// quick question), so an already-answered questionnaire can keep rendering as
// pills with the chosen option highlighted — even after a reload. Questions
// answered by typing free text instead of clicking simply yield no match.
export function matchAnswers(
  questions: ParsedQuestion[],
  reply: string,
): Record<number, string> {
  const answers: Record<number, string> = {};
  const lines = reply.split("\n");
  for (const q of questions) {
    for (const line of lines) {
      const t = line.trim();
      let rest: string | null = null;
      if (t.startsWith(`${q.number}. `)) {
        rest = t.slice(`${q.number}. `.length);
      } else if (t.startsWith(q.text)) {
        rest = t.slice(q.text.length);
      }
      if (rest === null) continue;
      const sep = rest.lastIndexOf(" — ");
      if (sep === -1) continue;
      const answer = rest.slice(sep + 3).trim();
      if (!answer) continue;
      // For button questions only accept an actual option, so an unrelated
      // line can't masquerade as an answer.
      if (q.options && !q.options.includes(answer)) continue;
      answers[q.number] = answer;
      break;
    }
  }
  return answers;
}

export function parseTriageQuestions(content: string): ParsedTriage | null {
  const lines = content.split("\n");
  const questions: ParsedQuestion[] = [];
  const keep: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const qMatch = lines[i].match(QUESTION_RE);
    if (qMatch) {
      // Look ahead (skipping blank lines) for an Options line.
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      const oMatch = j < lines.length ? lines[j].match(OPTIONS_RE) : null;

      if (oMatch) {
        const options = splitOptions(oMatch[1]);
        questions.push({
          number: Number(qMatch[1]),
          text: cleanLabel(qMatch[2]),
          options: options.length >= 2 ? options : null,
        });
        i = j + 1;
        continue;
      }

      // Options written inline on the question line, e.g. "3. Fever? (Yes / No)"
      const inline = qMatch[2].match(INLINE_OPTIONS_RE);
      if (inline) {
        const options = splitOptions(inline[1]);
        if (options.length >= 2) {
          questions.push({
            number: Number(qMatch[1]),
            text: cleanLabel(qMatch[2].replace(inline[0], "")),
            options,
          });
          i += 1;
          continue;
        }
      }

      // "Options:" crammed onto the question line, e.g.
      // "1. Fever? Options: Yes / No"
      const suffix = qMatch[2].match(OPTIONS_SUFFIX_RE);
      if (suffix) {
        const options = splitOptions(suffix[2]);
        if (options.length >= 2) {
          questions.push({
            number: Number(qMatch[1]),
            text: cleanLabel(suffix[1]),
            options,
          });
          i += 1;
          continue;
        }
      }

      // Numbered line without options: treat as a free-text question only if
      // it clearly reads as one (ends with "?" or invites typing).
      const text = qMatch[2].trim();
      if (/\?\**\s*$/.test(text) || /\(you can type|\(free.?text/i.test(text)) {
        questions.push({
          number: Number(qMatch[1]),
          text: cleanLabel(text),
          options: null,
        });
        i += 1;
        continue;
      }
    }

    // Unnumbered question with options on the same line, e.g.
    // "Would you like a care plan? Options: Yes, please / No, thanks"
    const bare = lines[i].match(OPTIONS_SUFFIX_RE);
    if (bare) {
      const options = splitOptions(bare[2]);
      if (options.length >= 2) {
        questions.push({
          number: nextNumber(questions),
          text: cleanLabel(bare[1]),
          options,
        });
        i += 1;
        continue;
      }
    }

    // Unnumbered question line followed by an Options line.
    const trimmed = lines[i].trim();
    if (/\?\**\s*$/.test(trimmed)) {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      const oMatch = j < lines.length ? lines[j].match(OPTIONS_RE) : null;
      if (oMatch) {
        const options = splitOptions(oMatch[1]);
        if (options.length >= 2) {
          questions.push({
            number: nextNumber(questions),
            text: cleanLabel(trimmed),
            options,
          });
          i = j + 1;
          continue;
        }
      }
    }

    keep.push(lines[i]);
    i += 1;
  }

  // Only treat it as a questionnaire if there's at least one clickable question.
  if (!questions.some((q) => q.options)) return null;

  const stripped = keep
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { stripped, questions };
}
