"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";

const PROTECT = [
  { href: "/phishing", label: "Phishing check", sub: "Links and look-alike sites" },
  { href: "/malware", label: "Malware check", sub: "Files, APKs, documents" },
  { href: "/signature", label: "Verify a document", sub: "Digital signatures" },
  { href: "/extension", label: "Browser extension", sub: "Always-on guard" },
];
const LINKS = [
  { href: "/#unmask", label: "Unmask" },
  { href: "/radar", label: "Scam Radar" },
  { href: "/learn", label: "Learn" },
  { href: "/research", label: "Research" },
];

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    addEventListener("pointerdown", close); addEventListener("keydown", close);
    return () => { removeEventListener("pointerdown", close); removeEventListener("keydown", close); };
  }, []);
  const item = (active: boolean) => `whitespace-nowrap rounded-lg px-3 py-2 text-[0.95rem] transition-colors ${active ? "bg-white/[0.08] text-white" : "text-ink-soft hover:text-white"}`;

  return (
    <header className="sticky top-0 z-40 border-b hairline bg-paper/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="scroll-progress absolute inset-x-0 bottom-[-1px] h-[2px] bg-teal" aria-hidden />
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6" aria-label="Main">
        <Link href="/" aria-label="TrustLens home" onClick={() => setOpen(false)}><Logo /></Link>
        <ul className="hidden items-center gap-0.5 lg:flex">
          <li><Link href="/#unmask" className={item(false)}>Unmask</Link></li>
          <li ref={menuRef} className="relative" onMouseEnter={() => setMenu(true)} onMouseLeave={() => setMenu(false)}>
            <button className={`${item(menu)} inline-flex items-center gap-1.5`} aria-expanded={menu} aria-haspopup="true" onClick={() => setMenu(!menu)}>
              Protect
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={`transition-transform duration-300 ${menu ? "rotate-180" : ""}`} aria-hidden><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <div className={`nav-menu absolute left-0 top-full pt-2 ${menu ? "is-open" : ""}`}>
              <ul className="w-72 rounded-2xl border hairline bg-[#0b0f10]/95 p-2 shadow-[0_30px_60px_-20px_#000] backdrop-blur-xl">
                {PROTECT.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} onClick={() => setMenu(false)} className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.05]">
                      <span className="block font-medium text-ink">{p.label}</span>
                      <span className="text-sm text-ink-soft">{p.sub}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
          {LINKS.slice(1).map((l) => (
            <li key={l.href}><Link href={l.href} aria-current={path === l.href ? "page" : undefined} className={item(path === l.href)}>{l.label}</Link></li>
          ))}
        </ul>
        <Link href="/check" className="btn-primary ml-auto hidden whitespace-nowrap rounded-xl px-4 py-2 text-[0.95rem] sm:inline-flex">
          Check a message
        </Link>
        <button
          className="ml-auto rounded-lg p-2 text-ink lg:hidden sm:ml-0"
          aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>
      {open && (
        <ul id="mobile-nav" className="border-t hairline px-4 pb-4 pt-2 lg:hidden">
          {[{ href: "/check", label: "Check a message" }, LINKS[0], ...PROTECT, ...LINKS.slice(1)].map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={() => setOpen(false)} className={`block rounded-lg px-3 py-3 text-lg ${path === l.href ? "bg-white/[0.08] text-white" : "text-ink-soft"}`}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
