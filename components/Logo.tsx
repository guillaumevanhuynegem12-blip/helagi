// The Helagi mark: a sprout rising from its roots, with a clay-vertebrae spine.
export function HelagiMark({
  className,
  reversed = false,
  crop = false,
}: {
  className?: string;
  reversed?: boolean;
  // When true, tighten the viewBox to the artwork (root tips at the bottom edge)
  // so the mark can be baseline-aligned next to the wordmark.
  crop?: boolean;
}) {
  const stroke = reversed ? "#EFE8D9" : "#1F5C45";
  const leafLower = reversed ? "#9ED3B2" : "#74B58C";
  const leafUpper = reversed ? "#74B58C" : "#4E9E72";

  return (
    <svg
      viewBox={crop ? "6 28 108 82" : "0 0 120 120"}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      {/* roots */}
      <g
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      >
        <path d="M60 95 C 53 100, 47 102, 41 106" />
        <path d="M60 95 C 60 101, 60 104, 60 108" />
        <path d="M60 95 C 67 100, 73 102, 79 106" />
      </g>
      {/* spine */}
      <path
        d="M60 96 C 57 82, 63 68, 60 52"
        stroke={stroke}
        strokeWidth="4.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* vertebrae */}
      <g fill="#D98E5A">
        <circle cx="58.3" cy="84" r="2.5" />
        <circle cx="61.2" cy="74" r="2.5" />
        <circle cx="59.2" cy="63.5" r="2.5" />
      </g>
      {/* leaves */}
      <path
        d="M60 55 C 49 53, 39 48, 33 39 C 42 39, 53 44, 60 55 Z"
        fill={leafLower}
      />
      <path
        d="M60 48 C 70 45, 80 40, 85 31 C 75 32, 64 38, 60 48 Z"
        fill={leafUpper}
      />
    </svg>
  );
}

// Mark + lowercase Fraunces wordmark, used in headers.
export function HelagiLockup({
  reversed = false,
  size = "md",
  className,
}: {
  reversed?: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  const markSize = size === "lg" ? "h-10 w-10" : "h-7 w-7";
  const textSize = size === "lg" ? "text-[30px]" : "text-xl";
  const gap = size === "lg" ? "gap-2" : "gap-2";

  return (
    <div className={`flex items-end ${gap} ${className ?? ""}`}>
      <HelagiMark className={`${markSize} shrink-0`} reversed={reversed} crop />
      <span
        className={`font-display ${textSize} lowercase leading-[0.8] tracking-tight ${
          reversed ? "text-cream" : "text-forest"
        }`}
      >
        helagi
      </span>
    </div>
  );
}
