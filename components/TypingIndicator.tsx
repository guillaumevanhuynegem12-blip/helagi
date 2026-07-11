// Three staggered bouncing dots shown while Helagi is "thinking" — before the
// first token arrives, and again if the stream stalls mid-answer.
export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Helagi is thinking">
      <span className="h-2 w-2 rounded-full bg-sage animate-bounce-dot [animation-delay:0ms]" />
      <span className="h-2 w-2 rounded-full bg-sage animate-bounce-dot [animation-delay:200ms]" />
      <span className="h-2 w-2 rounded-full bg-sage animate-bounce-dot [animation-delay:400ms]" />
    </div>
  );
}
