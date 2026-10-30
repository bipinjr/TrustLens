import Link from "next/link";

export const PROTECT_PAGES = [
  { href: "/unmask", label: "Unmask" },
  { href: "/phishing", label: "Phishing" },
  { href: "/malware", label: "Malware" },
  { href: "/signature", label: "Verify" },
  { href: "/extension", label: "Browser extension" },
] as const;

// Tabs across the Protect pages, so each tool is one tap from the others.
export function ProtectTabs({ current, className = "" }: { current: string; className?: string }) {
  return (
    <nav aria-label="Protect" className={`flex flex-wrap gap-2 ${className}`}>
      {PROTECT_PAGES.map((f) => (
        <Link key={f.href} href={f.href} aria-current={f.href === current ? "page" : undefined}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition ${f.href === current ? "border-teal/60 bg-teal/10 text-teal" : "border-white/10 text-ink-soft hover:border-white/30 hover:text-ink"}`}>
          {f.label}
        </Link>
      ))}
    </nav>
  );
}
