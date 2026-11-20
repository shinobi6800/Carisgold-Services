import { Suspense } from "react";
import type { Metadata } from "next";
import { PackageBuilder } from "@/components/packages/package-builder";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Event Juice Packages",
  description:
    "Build a Natures Burst juice package for your event, from 50 to 500 guests. Attendant, cups, dispensers and setup included.",
};

async function Builder() {
  const supabase = await createClient();

  const [tiers, products, treats, settings] = await Promise.all([
    supabase.from("packages").select("id, guests, varieties, price, includes").order("guests"),
    supabase
      .from("products")
      .select("id, name, category, is_preorder, sort_order")
      .eq("available_in_packages", true)
      .order("sort_order"),
    supabase.from("treats").select("id, name").order("sort_order"),
    supabase.from("settings").select("key, value"),
  ]);

  const error = tiers.error ?? products.error ?? treats.error ?? settings.error;
  if (error) {
    return (
      <p className="py-20 text-center text-destructive">Could not load packages: {error.message}</p>
    );
  }
  if (!tiers.data || tiers.data.length === 0) {
    return <p className="py-20 text-center text-muted-foreground">No packages available yet.</p>;
  }

  const s = Object.fromEntries((settings.data ?? []).map((r) => [r.key, r.value]));
  const config = {
    extraVarietyPrice: Number(s.extra_variety_price ?? 150),
    treatPricePerPerson: Number(s.treat_price_per_person ?? 15),
    treatPicks: Number(s.treat_picks ?? 3),
    minNoticeDays: Number(s.min_notice_days ?? 14),
  };

  return (
    <PackageBuilder
      tiers={tiers.data.map((t) => ({ ...t, price: Number(t.price) }))}
      products={products.data ?? []}
      treats={treats.data ?? []}
      config={config}
    />
  );
}

function BuilderSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
      <Skeleton className="hidden h-80 rounded-2xl lg:col-span-4 lg:block" />
    </div>
  );
}

const included = ["Attendant included", "Cups and dispensers", "Setup done for you"];

export default function PackagesPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at top right, color-mix(in oklab, var(--brand-orange) 38%, transparent), transparent 55%), radial-gradient(ellipse at bottom left, color-mix(in oklab, var(--brand-magenta) 50%, transparent), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16 md:py-20">
          <p className="text-sm font-medium tracking-wide text-[var(--brand-orange)]">
            Natures Burst for your event
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            Event juice packages
          </h1>
          <p className="mt-4 max-w-xl text-primary-foreground/80 sm:text-lg">
            Choose your guest count, pick your varieties and add local treats. We bring the drinks
            and look after the serving.
          </p>

          <ul className="mt-8 grid max-w-2xl grid-cols-1 gap-3 border-t border-primary-foreground/20 pt-6 text-sm sm:grid-cols-3">
            {included.map((text) => (
              <li key={text} className="flex items-center gap-2.5">
                <span className="bg-brand-gradient h-0.5 w-5 rounded-full" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-brand-gradient relative h-1 w-full" />
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10 sm:pt-12">
        <Suspense fallback={<BuilderSkeleton />}>
          <Builder />
        </Suspense>
      </div>
    </>
  );
}
