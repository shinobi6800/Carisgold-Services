"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  is_preorder: boolean;
  product_variants: { id: string; size: string; price: number }[];
};

const SIZE_ORDER = ["250ml", "350ml", "500ml", "gallon", "single"];
const SIZE_LABEL: Record<string, string> = {
  "250ml": "250ml",
  "350ml": "350ml",
  "500ml": "500ml",
  gallon: "Gallon",
  single: "Each",
};

const CATEGORY_LABEL: Record<string, string> = {
  juice: "Juice",
  local_drink: "Local drink",
};

export function ProductCard({ product }: { product: ShopProduct }) {
  const add = useCart((s) => s.add);

  const variants = [...product.product_variants].sort(
    (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)
  );
  const [selectedId, setSelectedId] = useState(
    () => (variants.find((v) => v.size === "500ml") ?? variants[0]).id
  );
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const label = SIZE_LABEL[selected.size] ?? selected.size;

  function handleAdd() {
    add({
      variantId: selected.id,
      productId: product.id,
      name: product.name,
      size: label,
      price: Number(selected.price),
      isPreorder: product.is_preorder,
    });
    toast.success(`${product.name} (${label}) added to cart`);
  }

  return (
    <article className="flex gap-4 rounded-xl border bg-card p-3 sm:flex-col sm:gap-0 sm:border-0 sm:bg-transparent sm:p-0">
      {/* Image: small square on phones, big square on larger screens */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary sm:aspect-square sm:h-auto sm:w-full sm:rounded-xl">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Image
              src="/logo.jpg"
              alt=""
              width={72}
              height={72}
              className="size-10 rounded-full opacity-40 sm:size-[72px]"
            />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col sm:mt-4">
        <div className="flex items-center gap-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {CATEGORY_LABEL[product.category] ?? product.category}
          </p>
          {product.is_preorder && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
              Preorder
            </span>
          )}
        </div>

        <h3 className="mt-1 font-display text-base font-semibold leading-snug text-primary sm:text-lg">
          {product.name}
        </h3>

        {variants.length > 1 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Size">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={v.id === selectedId}
                onClick={() => setSelectedId(v.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  v.id === selectedId
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:border-primary/50"
                )}
              >
                {SIZE_LABEL[v.size] ?? v.size}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="font-display text-lg text-primary">
            {formatGHS(Number(selected.price))}
          </span>
          <Button size="sm" onClick={handleAdd}>
            Add to cart
          </Button>
        </div>
      </div>
    </article>
  );
}
