"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/produtos", label: "Produtos", icon: "📦" },
  { href: "/lojas", label: "Lojas", icon: "🏪" },
  { href: "/movimentacoes", label: "Movimentação", icon: "🔁" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-brand-red">●</span> Merch Control
        </Link>
        <nav className="flex gap-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-red/10 text-brand-red"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
