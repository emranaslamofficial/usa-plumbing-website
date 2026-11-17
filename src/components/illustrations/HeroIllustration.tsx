/**
 * Lightweight vector illustration (no image request → great LCP).
 * Replace with a real team/job photo via next/image when available — real photos convert best.
 */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 460" className={className} role="img" aria-labelledby="hero-ill-title">
      <title id="hero-ill-title">Illustration of a home plumbing system with water heater, sink and pipes</title>
      <defs>
        <linearGradient id="hi-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef5ff" />
          <stop offset="1" stopColor="#d9e8ff" />
        </linearGradient>
        <linearGradient id="hi-pipe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5a97f8" />
          <stop offset="1" stopColor="#1d5bd3" />
        </linearGradient>
        <linearGradient id="hi-hot" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffc24d" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="hi-tank" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9eef6" />
        </linearGradient>
        <filter id="hi-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0f1a31" floodOpacity="0.14" />
        </filter>
      </defs>

      {/* House silhouette */}
      <path d="M40 190 260 40l220 150v250H40Z" fill="url(#hi-bg)" />
      <path d="M40 190 260 40l220 150" fill="none" stroke="#bcd6ff" strokeWidth="6" strokeLinejoin="round" />
      <rect x="40" y="300" width="440" height="4" fill="#bcd6ff" />

      {/* Pipe network */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 420h120v-90h70" stroke="url(#hi-pipe)" strokeWidth="12" />
        <path d="M250 330h60V230h70" stroke="url(#hi-pipe)" strokeWidth="12" />
        <path d="M160 360v-150h40" stroke="url(#hi-hot)" strokeWidth="10" />
        <path d="M380 230v-30" stroke="url(#hi-pipe)" strokeWidth="12" />
      </g>
      {/* Fittings */}
      {[
        [180, 420],
        [180, 330],
        [250, 330],
        [310, 330],
        [310, 230],
        [160, 210],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x - 10} y={y - 10} width="20" height="20" rx="5" fill="#1a49ab" />
      ))}

      {/* Water heater */}
      <g filter="url(#hi-shadow)">
        <rect x="96" y="250" width="92" height="160" rx="22" fill="url(#hi-tank)" stroke="#d3dbe8" strokeWidth="2" />
        <rect x="110" y="300" width="64" height="8" rx="4" fill="#d3dbe8" />
        <circle cx="142" cy="360" r="16" fill="#fff4dc" />
        <path d="M142 349c5 6 8 10 8 14a8 8 0 0 1-16 0c0-4 3-8 8-14Z" fill="url(#hi-hot)" />
      </g>

      {/* Sink + faucet */}
      <g filter="url(#hi-shadow)">
        <path d="M330 196h110v10a32 32 0 0 1-32 32h-46a32 32 0 0 1-32-32Z" fill="#ffffff" stroke="#d3dbe8" strokeWidth="2" />
        <path d="M380 196v-46a14 14 0 0 1 14-14h10a14 14 0 0 1 14 14v10" fill="none" stroke="#3f4e6a" strokeWidth="8" strokeLinecap="round" />
        <rect x="368" y="186" width="24" height="10" rx="3" fill="#3f4e6a" />
      </g>
      {/* Water drops */}
      <g className="motion-safe:animate-float-slow">
        <path d="M418 172c4 5 7 9 7 12a7 7 0 0 1-14 0c0-3 3-7 7-12Z" fill="#5a97f8" />
      </g>

      {/* Floating status card */}
      <g filter="url(#hi-shadow)" className="motion-safe:animate-float-slow" style={{ animationDelay: "-3s" }}>
        <rect x="292" y="300" width="196" height="76" rx="18" fill="#ffffff" />
        <circle cx="328" cy="338" r="18" fill="#ecfdf5" />
        <path d="m319 338 6 6 12-12" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="356" y="324" width="104" height="10" rx="5" fill="#1b2740" />
        <rect x="356" y="342" width="76" height="8" rx="4" fill="#aab7cc" />
      </g>

      {/* Wrench badge */}
      <g filter="url(#hi-shadow)">
        <circle cx="92" cy="170" r="34" fill="#ffc24d" />
        <path
          d="M101 157a11 11 0 0 0-14 13l-13 13a4 4 0 0 0 6 6l13-13a11 11 0 0 0 13-14l-6 6-6-1-1-6Z"
          fill="#08101f"
        />
      </g>
    </svg>
  );
}
