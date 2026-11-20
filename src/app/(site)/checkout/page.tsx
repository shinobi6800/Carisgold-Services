import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

async function Checkout() {
  const supabase = await createClient();
  const [terms, notice] = await Promise.all([
    supabase.from("terms").select("body").eq("is_current", true).single(),
    supabase.from("settings").select("value").eq("key", "min_notice_days").maybeSingle(),
  ]);

  return (
    <CheckoutClient
      termsBody={terms.data?.body ?? ""}
      minNoticeDays={Number(notice.data?.value ?? 14)}
    />
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-7">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="hidden h-72 rounded-2xl lg:col-span-5 lg:block" />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:pt-12 md:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl md:text-5xl">
        Checkout
      </h1>
      <div className="mt-10">
        <Suspense fallback={<CheckoutSkeleton />}>
          <Checkout />
        </Suspense>
      </div>
    </div>
  );
}
