"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { toast } from "sonner";
import { CartSheet } from "@/components/shop/cart-sheet";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { site } from "@/lib/site";
import { useAuthUser } from "@/lib/use-auth-user";
import { cn } from "@/lib/utils";

const linkClass =
  "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-primary";

export function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const user = useAuthUser();

  async function logout() {
    await createClient().auth.signOut();
    setOpen(false);
    toast.success("Logged out");
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 md:h-16">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image
            src="/logo.jpg"
            alt="Caris Gold logo"
            width={40}
            height={40}
            priority
            className="size-9 shrink-0 rounded-full md:size-10"
          />
          <span className="truncate font-display text-base font-semibold tracking-tight text-primary md:text-lg">
            CarisGold
            <span className="hidden font-normal text-muted-foreground sm:inline"> Events</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center">
          <nav className="hidden items-center gap-1 md:flex">
            {site.nav.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ))}
            {user === null && (
              <Link href="/login" className={linkClass}>
                Log in
              </Link>
            )}
            {user && (
              <button type="button" onClick={logout} className={linkClass}>
                Log out
              </button>
            )}
          </nav>

          <CartSheet />

          <Link
            href="/book"
            className={cn(buttonVariants({ size: "sm" }), "ml-2 hidden md:inline-flex")}
          >
            Book now
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="px-4 pt-4 font-display text-xl text-primary">
                {site.name}
              </SheetTitle>
              <nav className="flex flex-col gap-1 p-4">
                {site.nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
                {user === null && (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base hover:bg-muted"
                  >
                    Log in
                  </Link>
                )}
                {user && (
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-md px-3 py-3 text-left text-base hover:bg-muted"
                  >
                    Log out
                  </button>
                )}
                <Link
                  href="/book"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants(), "mt-3")}
                >
                  Book now
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="bg-brand-gradient h-0.5 w-full" />
    </header>
  );
}
