"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePackageDraft } from "@/store/package-draft";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PackageTier = {
  id: string;
  guests: number;
  varieties: number;
  price: number;
  includes: string;
};
export type PackageProduct = {
  id: string;
  name: string;
  category: string;
  is_preorder: boolean;
};
export type PackageTreat = { id: string; name: string };
export type PackageConfig = {
  extraVarietyPrice: number;
  treatPricePerPerson: number;
  treatPicks: number;
  minNoticeDays: number;
};

const CATEGORY_ORDER = ["juice", "local_drink", "mocktail"];
const CATEGORY_LABEL: Record<string, string> = {
  juice: "Juices and smoothies",
  local_drink: "Local drinks",
  mocktail: "Mocktails",
};

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function SectionTitle({ no, title, hint }: { no: number; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--brand-orange)] bg-primary font-display text-sm font-semibold text-primary-foreground">
        {no}
      </span>
      <div>
        <h2 className="font-display text-xl font-semibold text-primary md:text-2xl">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function CheckDot({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
        on
          ? "border-[var(--brand-orange)] bg-[var(--brand-orange)] text-[#2a1519]"
          : "border-muted-foreground/40"
      )}
    >
      {on && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}

const optionBase = "rounded-lg border px-3.5 py-3 text-left text-sm transition-colors";
const optionOn = "border-primary bg-primary text-primary-foreground";
const optionOff = "bg-card hover:border-[var(--brand-orange)]";

export function PackageBuilder({
  tiers,
  products,
  treats,
  config,
}: {
  tiers: PackageTier[];
  products: PackageProduct[];
  treats: PackageTreat[];
  config: PackageConfig;
}) {
  const router = useRouter();
  const setDraft = usePackageDraft((s) => s.setDraft);

  const [tierId, setTierId] = useState(tiers[0].id);
  const [varietyIds, setVarietyIds] = useState<string[]>([]);
  const [withTreats, setWithTreats] = useState(false);
  const [treatIds, setTreatIds] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState("");

  const tier = tiers.find((t) => t.id === tierId) ?? tiers[0];
  const extra = Math.max(0, varietyIds.length - tier.varieties);
  const treatsTotal = withTreats ? tier.guests * config.treatPricePerPerson : 0;
  const total = Number(tier.price) + extra * config.extraVarietyPrice + treatsTotal;

  // Days until the event (only computed after the customer picks a date)
  let daysUntil: number | null = null;
  if (eventDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const event = new Date(`${eventDate}T00:00:00`);
    daysUntil = Math.round((event.getTime() - today.getTime()) / 86400000);
  }
  const isPast = daysUntil !== null && daysUntil < 0;
  const isLate = daysUntil !== null && daysUntil >= 0 && daysUntil < config.minNoticeDays;

  const problems: string[] = [];
  if (varietyIds.length < tier.varieties) {
    const n = tier.varieties - varietyIds.length;
    problems.push(`Choose ${n} more ${n === 1 ? "variety" : "varieties"}`);
  }
  if (withTreats && treatIds.length < config.treatPicks) {
    const n = config.treatPicks - treatIds.length;
    problems.push(`Pick ${n} more ${n === 1 ? "treat" : "treats"}`);
  }
  if (!eventDate) problems.push("Choose your event date");
  else if (isPast) problems.push("Event date is in the past");

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: products.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  function proceed() {
    if (problems.length > 0) return;
    const nameOf = (id: string) => products.find((p) => p.id === id)?.name ?? "";
    setDraft({
      packageId: tier.id,
      guests: tier.guests,
      includedVarieties: tier.varieties,
      packagePrice: Number(tier.price),
      extraVarieties: extra,
      varieties: varietyIds.map((id) => ({ id, name: nameOf(id) })),
      withTreats,
      treats: withTreats
        ? treatIds.map((id) => ({ id, name: treats.find((t) => t.id === id)?.name ?? "" }))
        : [],
      eventDate,
      total,
    });
    router.push("/checkout?type=package");
  }

  const summary = (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-primary">Your package</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">
            {tier.guests} guests, {tier.varieties} varieties
          </dt>
          <dd>{formatGHS(Number(tier.price))}</dd>
        </div>
        {extra > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              {extra} extra {extra === 1 ? "variety" : "varieties"}
            </dt>
            <dd>{formatGHS(extra * config.extraVarietyPrice)}</dd>
          </div>
        )}
        {withTreats && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Local treats, {tier.guests} guests</dt>
            <dd>{formatGHS(treatsTotal)}</dd>
          </div>
        )}
      </dl>
      <div className="flex items-baseline justify-between border-t pt-4">
        <span className="text-muted-foreground">Total</span>
        <span className="font-display text-3xl text-primary">{formatGHS(total)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Transport and taxes are quoted separately. Full payment is made at checkout.
      </p>
      {isLate && (
        <p className="rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
          Your event is less than {config.minNoticeDays} days away. Late orders may attract
          additional charges.
        </p>
      )}
      {problems.length > 0 && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {problems.map((p) => (
            <li key={p}>• {p}</li>
          ))}
        </ul>
      )}
      <Button size="lg" className="w-full" disabled={problems.length > 0} onClick={proceed}>
        Continue to checkout
      </Button>
    </div>
  );

  return (
    <div className="grid gap-10 pb-28 lg:grid-cols-12 lg:pb-0">
      <div className="space-y-14 lg:col-span-8">
        {/* 1. Guests */}
        <section className="space-y-5">
          <SectionTitle no={1} title="Number of guests" hint={`${tier.includes}.`} />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {tiers.map((t) => {
              const on = t.id === tierId;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTierId(t.id)}
                  className={cn(
                    "rounded-xl border p-3.5 text-left transition-all",
                    on
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "bg-card hover:-translate-y-0.5 hover:border-[var(--brand-orange)] hover:shadow-sm"
                  )}
                >
                  <span
                    className={cn(
                      "block font-display text-2xl",
                      on ? "text-primary-foreground" : "text-primary"
                    )}
                  >
                    {t.guests}
                  </span>
                  <span
                    className={cn(
                      "block text-xs",
                      on ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    guests
                  </span>
                  <span className="my-3 block h-px w-full bg-current opacity-15" />
                  <span
                    className={cn(
                      "block text-xs",
                      on ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {t.varieties} varieties
                  </span>
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      on ? "text-[var(--brand-orange)]" : "text-primary"
                    )}
                  >
                    {formatGHS(Number(t.price))}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Varieties */}
        <section className="space-y-6">
          <SectionTitle
            no={2}
            title="Choose your varieties"
            hint={`${varietyIds.length} selected. ${tier.varieties} are included, and each extra is ${formatGHS(config.extraVarietyPrice)}.`}
          />

          {grouped.map((g) => (
            <div key={g.cat} className="space-y-3">
              <h3 className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                <span className="bg-brand-gradient h-0.5 w-6 rounded-full" />
                {CATEGORY_LABEL[g.cat] ?? g.cat}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {g.items.map((p) => {
                  const on = varietyIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setVarietyIds((list) => toggle(list, p.id))}
                      className={cn(
                        optionBase,
                        "flex items-center justify-between gap-3",
                        on ? optionOn : optionOff
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block">{p.name}</span>
                        {p.is_preorder && (
                          <span
                            className={cn(
                              "text-xs",
                              on ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                          >
                            Preorder
                          </span>
                        )}
                      </span>
                      <CheckDot on={on} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* 3. Treats */}
        <section className="space-y-5">
          <SectionTitle
            no={3}
            title="Local treats (optional)"
            hint={`Pick ${config.treatPicks} treats at ${formatGHS(config.treatPricePerPerson)} per person. Treats are priced separately from the juice package.`}
          />

          <button
            type="button"
            aria-pressed={withTreats}
            onClick={() => setWithTreats((v) => !v)}
            className={cn(
              optionBase,
              "flex w-full items-center justify-between gap-3 py-4",
              withTreats ? optionOn : optionOff
            )}
          >
            <span>
              Add local treats for {tier.guests} guests
              <span
                className={cn(
                  "block text-xs",
                  withTreats ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {formatGHS(tier.guests * config.treatPricePerPerson)}
              </span>
            </span>
            <CheckDot on={withTreats} />
          </button>

          {withTreats && (
            <div className="grid gap-2 sm:grid-cols-2">
              {treats.map((t) => {
                const on = treatIds.includes(t.id);
                const full = !on && treatIds.length >= config.treatPicks;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    disabled={full}
                    onClick={() => setTreatIds((list) => toggle(list, t.id))}
                    className={cn(
                      optionBase,
                      "flex items-center justify-between gap-3",
                      on ? optionOn : optionOff,
                      full && "opacity-40"
                    )}
                  >
                    <span>{t.name}</span>
                    <CheckDot on={on} />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. Date */}
        <section className="space-y-5">
          <SectionTitle
            no={4}
            title="Event date"
            hint={`Please order at least ${config.minNoticeDays} days (two clear weeks) before the event. Themed setup and custom branding may attract extra charges.`}
          />
          <div className="max-w-xs space-y-2">
            <Label htmlFor="event_date">Date of your event</Label>
            <Input
              id="event_date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
        </section>
      </div>

      {/* Desktop summary */}
      <aside className="hidden self-start overflow-hidden rounded-2xl border bg-card shadow-sm lg:sticky lg:top-24 lg:col-span-4 lg:block">
        <div className="bg-brand-gradient h-1.5 w-full" />
        <div className="p-6">{summary}</div>
      </aside>

      {/* Mobile bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-primary px-4 pt-3.5 text-primary-foreground pb-[max(0.875rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="bg-brand-gradient absolute inset-x-0 top-0 h-0.5" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-xl leading-none">{formatGHS(total)}</p>
            <p className="mt-1.5 truncate text-xs text-primary-foreground/70">
              {problems[0] ?? (isLate ? "Late order: extra charges may apply" : "Ready to checkout")}
            </p>
          </div>
          <Button
            disabled={problems.length > 0}
            onClick={proceed}
            className="bg-[var(--brand-orange)] text-[#2a1519] hover:bg-[var(--brand-orange)]/90"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
