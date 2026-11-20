"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CreditCard, ExternalLink, LayoutDashboard, LogOut, ShoppingBag, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

export function AdminShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-muted/40 lg:grid lg:grid-cols-[250px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col bg-primary text-primary-foreground lg:flex">
        <div className="bg-brand-gradient h-1 w-full" />
        <div className="flex items-center gap-3 px-5 py-6">
          <Image src="/logo.jpg" alt="" width={40} height={40} className="size-10 rounded-full bg-white" />
          <div>
            <p className="font-display text-lg font-semibold leading-tight">CarisGold</p>
            <p className="text-xs text-primary-foreground/70">Admin dashboard</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-white/15 font-medium text-white"
                  : "text-primary-foreground/75 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
              {isActive(item.href) && (
                <span className="ml-auto size-1.5 rounded-full bg-[var(--brand-orange)]" />
              )}
            </Link>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/15 p-3">
          <p className="truncate px-3 pb-1 text-xs text-primary-foreground/60">{name}</p>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-primary-foreground/75 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="size-4" />
            View site
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-primary-foreground/75 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 bg-primary text-primary-foreground lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.jpg" alt="" width={32} height={32} className="size-8 rounded-full bg-white" />
              <span className="font-display text-base font-semibold">CarisGold Admin</span>
            </div>
            <button type="button" onClick={logout} aria-label="Log out" className="p-1.5">
              <LogOut className="size-4" />
            </button>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm",
                  isActive(item.href)
                    ? "bg-white text-primary"
                    : "bg-white/10 text-primary-foreground/85"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="bg-brand-gradient h-0.5 w-full" />
        </header>

        <main className="mx-auto max-w-[1400px] p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
