// Mark: "Iris" — a lens that watches. Same artwork as the favicon and the extension icon.
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id="tl-tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#172022" /><stop offset="1" stopColor="#07090a" /></linearGradient>
        <linearGradient id="tl-mint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a7f3d0" /><stop offset=".5" stopColor="#5eead4" /><stop offset="1" stopColor="#14b8a6" /></linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#tl-tile)" />
      <rect x=".5" y=".5" width="63" height="63" rx="15.5" fill="none" stroke="#5eead4" strokeOpacity=".28" />
      <circle cx="32" cy="32" r="17" fill="none" stroke="url(#tl-mint)" strokeWidth="5" />
      <circle cx="32" cy="32" r="7.5" fill="url(#tl-mint)" />
      <circle cx="29" cy="29" r="2.4" fill="#07090a" opacity=".85" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`group inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105" />
      <span className="font-display text-[1.6rem] leading-none tracking-tight text-ink">
        Trust<em className="text-teal">Lens</em>
      </span>
    </span>
  );
}
