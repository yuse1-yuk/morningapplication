'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/todo", label: "ToDo" },
  { href: "/settings", label: "設定" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white/90 shadow-lg backdrop-blur-xl">
      <div className="text-lg font-semibold">StartAM</div>
      <div className="flex items-center gap-2 text-sm">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1 transition ${
                active
                  ? "bg-white !text-slate-900 shadow-md"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
