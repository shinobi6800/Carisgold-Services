"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ProductCard, type ShopProduct } from "./product-card";
import { cn } from "@/lib/utils";

const tabs = [
  { value: "all", label: "All" },
  { value: "juice", label: "Juices and smoothies" },
  { value: "local_drink", label: "Local drinks" },
];

export function ShopCatalog({ products }: { products: ShopProduct[] }) {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) => (tab === "all" || p.category === tab) && (!q || p.name.toLowerCase().includes(q))
    );
  }, [products, tab, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          type="search"
          placeholder="Search drinks"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:order-2 md:w-64"
        />

        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2" role="tablist" aria-label="Categories">
            {tabs.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={tab === t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors",
                  tab === t.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:border-primary/50"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        {visible.length} {visible.length === 1 ? "product" : "products"}
      </p>

      {visible.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">Nothing matches your search.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
