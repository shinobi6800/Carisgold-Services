"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/store/cart";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

export function CartSheet() {
  const [open, setOpen] = useState(false);
  // Avoids a hydration mismatch: the saved cart only exists in the browser.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  const count = mounted ? items.reduce((n, i) => n + i.quantity, 0) : 0;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const hasPreorder = items.some((i) => i.isPreorder);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={`Open cart, ${count} items`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
      >
        <ShoppingCart className="size-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-[var(--brand-magenta)] px-1 text-[11px] font-semibold leading-5 text-white">
            {count}
          </span>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetTitle className="border-b px-5 py-4 font-display text-xl text-primary">
          Your cart
        </SheetTitle>

        {!mounted || items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Browse the shop
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{item.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.size} · {formatGHS(item.price)}
                      {item.isPreorder && " · Preorder"}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                        className="flex size-8 items-center justify-center rounded-md border hover:bg-muted"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                        className="flex size-8 items-center justify-center rounded-md border hover:bg-muted"
                      >
                        <Plus className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => remove(item.variantId)}
                        className="ml-2 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <p className="font-display text-lg text-primary">
                    {formatGHS(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-display text-2xl text-primary">{formatGHS(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Transport and taxes are quoted separately.
                {hasPreorder && " Preorder items are prepared to order."}
              </p>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ size: "lg" }), "w-full")}
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
