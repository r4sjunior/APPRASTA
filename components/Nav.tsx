"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";
import { LogoutButton } from "./LogoutButton";

const ADMIN_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/produtos", label: "Produtos", icon: "📦" },
  { href: "/lojas", label: "Lojas", icon: "🏪" },
  { href: "/movimentacoes", label: "Movimentação", icon: "🔁" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "🧾" },
  { href: "/admin/trocas", label: "Trocas", icon: "↩️" },
  { href: "/admin/usuarios", label: "Cadastros", icon: "✅" },
  { href: "/admin/relatorios", label: "Relatórios", icon: "📁" },
];

const LOJA_ITEMS = [
  { href: "/loja", label: "Estoque", icon: "📦" },
  { href: "/loja/pedidos", label: "Pedidos", icon: "🧾" },
  { href: "/loja/pagamentos", label: "Pagamentos", icon: "💳" },
  { href: "/loja/trocas", label: "Trocas", icon: "↩️" },
];

export function Nav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = role === "admin" ? ADMIN_ITEMS : LOJA_ITEMS;
  const homeHref = role === "admin" ? "/" : "/loja";

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link
          href={homeHref}
          className="flex items-center gap-2 font-bold text-lg"
        >
          <span className="text-brand-red">●</span> Merch Control
        </Link>
        <nav className="flex flex-1 flex-wrap gap-1">
          {items.map((item) => {
            const active =
              item.href === homeHref
                ? pathname === item.href
                : pathname.startsWith(item.href);
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
        <LogoutButton className="text-sm font-medium text-neutral-500 hover:text-brand-red transition" />
      </div>
    </header>
  );
}
