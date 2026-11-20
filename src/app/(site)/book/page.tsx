import { Suspense } from "react";
import type { Metadata } from "next";
import { BookingForm } from "@/components/book/booking-form";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Book an Event",
  description:
    "Request event management or decor from CarisGold Events. Tell us your date and ideas and we will send a quote.",
};

const steps = [
  { no: "01", title: "Send your request", text: "Tell us the date, venue, guest count and your ideas." },
  { no: "02", title: "We send a quote", text: "We review your details and reply with a price." },
  { no: "03", title: "Pay in full", text: "Accept the quote and pay online to confirm your date." },
  { no: "04", title: "We plan the rest", text: "We take care of the planning, decor and the day itself." },
];

async function Booking() {
  const supabase = await createClient();
  const [terms, notice] = await Promise.all([
    supabase.from("terms").select("body").eq("is_current", true).single(),
    supabase.from("settings").select("value").eq("key", "min_notice_days").maybeSingle(),
  ]);

  return (
    <BookingForm
      termsBody={terms.data?.body ?? ""}
      minNoticeDays={Number(notice.data?.value ?? 14)}
    />
  );
}

function BookingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-48" />
      <div className="grid gap-2.5 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function BookPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:pt-12 md:pt-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl md:text-5xl">
          Book an event
        </h1>
        <p className="mt-2 text-muted-foreground sm:mt-3">
          Tell us about your event and we will send you a quote. Event management and decor are
          priced to fit your event.
        </p>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Suspense fallback={<BookingSkeleton />}>
            <Booking />
          </Suspense>
        </div>

        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="lg:sticky lg:top-24">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              How it works
            </h2>
            <ol className="mt-4 divide-y border-y">
              {steps.map((s) => (
                <li key={s.no} className="flex gap-4 py-4">
                  <span className="font-display text-lg text-[var(--brand-magenta)]">{s.no}</span>
                  <div>
                    <p className="font-medium text-primary">{s.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              Quotes exclude transport and taxes. Orders should be made at least two clear weeks
              before your event.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
