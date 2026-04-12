/**
 * FC 26 Career Hub — Logo mark
 * Self-contained inline SVG, no external dependencies.
 * Use <LogoMark size={32} /> anywhere in the app.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="FC 26 Career Hub"
    >
      <defs>
        <radialGradient id="lm-bg-glow" cx="50%" cy="28%" r="55%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lm-spot" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lm-shield-fill" x1="32" y1="8" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#16291a" />
          <stop offset="100%" stopColor="#0d1a10" />
        </linearGradient>
        <linearGradient id="lm-stroke" x1="12" y1="8" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="64" height="64" rx="14" fill="#0b1118" />
      <rect width="64" height="64" rx="14" fill="url(#lm-bg-glow)" />

      {/* Shield body */}
      <path
        d="M12 9 H52 V35 C52 47 43 55.5 32 59.5 C21 55.5 12 47 12 35 Z"
        fill="url(#lm-shield-fill)"
        stroke="url(#lm-stroke)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Inner shield highlight */}
      <path
        d="M15 12 H49 V35 C49 45 41.5 52.5 32 56 C22.5 52.5 15 45 15 35 Z"
        fill="#22c55e"
        fillOpacity="0.05"
      />

      {/* Top edge accent */}
      <path
        d="M12 9 H52"
        stroke="#4ade80"
        strokeWidth="1.6"
        strokeOpacity="0.6"
        strokeLinecap="round"
      />

      {/* Pitch: halfway line */}
      <line x1="12" y1="33" x2="52" y2="33" stroke="#22c55e" strokeWidth="0.9" strokeOpacity="0.38" />

      {/* Pitch: center circle */}
      <circle cx="32" cy="33" r="10.5" stroke="#22c55e" strokeWidth="1.1" strokeOpacity="0.6" fill="none" />

      {/* Center spot glow */}
      <circle cx="32" cy="33" r="5" fill="url(#lm-spot)" />

      {/* Center spot */}
      <circle cx="32" cy="33" r="2.4" fill="#4ade80" />

      {/* Crown detail */}
      <path
        d="M28 9 L32 5.5 L36 9"
        stroke="#4ade80"
        strokeWidth="1.4"
        strokeOpacity="0.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
