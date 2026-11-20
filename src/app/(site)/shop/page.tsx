import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop/shop-catalog";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop",
  description: "Order fresh Natures Burst juices, smoothies and local drinks by the bottle or gallon.",
};

async function Catalog() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, category, description, image_url, is_preorder, sort_order, product_variants(id, size, price)"
    )
    .eq("available_in_shop", true)
    .order("sort_order");

  if (error) {
    return <p className="py-20 text-center text-destructive">Could not load products: {error.message}</p>;
  }

  const products = (data ?? []).filter((p) => p.product_variants.length > 0);
  return <ShopCatalog products={products} />;
}

function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-xl border p-3 sm:flex-col sm:border-0 sm:p-0">
          <Skeleton className="h-24 w-24 shrink-0 rounded-lg sm:aspect-square sm:h-auto sm:w-full sm:rounded-xl" />
          <div className="flex-1 space-y-2 sm:mt-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:pt-12 md:pt-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl md:text-5xl">
          Shop
        </h1>
        <p className="mt-2 text-muted-foreground sm:mt-3">
          Fresh Natures Burst juices, smoothies and local drinks, by the bottle or gallon.
        </p>
      </div>

      {site.phone && (
        <p className="mt-5 rounded-lg bg-secondary px-4 py-3 text-sm">
          Need help or want to order directly?{" "}
          <a
            href={`tel:${site.phone.replace(/\s+/g, "")}`}
            className="font-medium text-primary underline underline-offset-4"
          >
            Call {site.phone}
          </a>
        </p>
      )}

      <div className="mt-8 sm:mt-10">
        <Suspense fallback={<CatalogSkeleton />}>
          <Catalog />
        </Suspense>
      </div>
    </div>
  );
}
