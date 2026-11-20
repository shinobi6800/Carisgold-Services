"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/app/(site)/checkout/actions";
import { useCart } from "@/store/cart";
import { usePackageDraft } from "@/store/package-draft";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

type Fulfilment = "pickup" | "delivery";

function Field({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function CheckoutClient({
  termsBody,
  minNoticeDays,
}: {
  termsBody: string;
  minNoticeDays: number;
}) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const isPackage = useSearchParams().get("type") === "package";
  const items = useCart((s) => s.items);
  const draft = usePackageDraft((s) => s.draft);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfilment, setFulfilment] = useState<Fulfilment>("pickup");
  const [address, setAddress] = useState("");
  const [neededDate, setNeededDate] = useState("");
  const [notes, setNotes] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [website, setWebsite] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!mounted) return null;

  const hasContent = isPackage ? Boolean(draft) : items.length > 0;
  if (!hasContent) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">
          {isPackage ? "Your package is empty." : "Your cart is empty."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/shop" className={cn(buttonVariants())}>
            Browse the shop
          </Link>
          <Link href="/packages" className={cn(buttonVariants({ variant: "outline" }))}>
            Build a package
          </Link>
        </div>
      </div>
    );
  }

  const total = isPackage && draft ? draft.total : items.reduce((s, i) => s + i.price * i.quantity, 0);
  const hasPreorder = !isPackage && items.some((i) => i.isPreorder);

  let late = false;
  if (isPackage && draft) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round(
      (new Date(`${draft.eventDate}T00:00:00`).getTime() - today.getTime()) / 86400000
    );
    late = days >= 0 && days < minNoticeDays;
  }

  function clearError(key: string) {
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const common = {
      customer_name: customerName,
      email,
      phone,
      fulfilment: isPackage ? ("delivery" as const) : fulfilment,
      delivery_address: address,
      needed_date: isPackage ? "" : neededDate,
      notes,
      accepted_terms: accepted,
      website,
    };

    startTransition(async () => {
      const result =
        isPackage && draft
          ? await createOrder({
              kind: "package",
              ...common,
              packageId: draft.packageId,
              varietyIds: draft.varieties.map((v) => v.id),
              withTreats: draft.withTreats,
              treatIds: draft.treats.map((t) => t.id),
              eventDate: draft.eventDate,
            })
          : await createOrder({
              kind: "juice",
              ...common,
              items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
            });

      if (result.ok) {
        setRedirecting(true);
        window.location.href = result.url;
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error);
    });
  }

  const summaryBody = (
    <div className="space-y-4">
      {isPackage && draft ? (
        <>
          <div className="flex justify-between gap-4 text-sm">
            <span>
              Juice package, {draft.guests} guests
              <span className="block text-xs text-muted-foreground">
                {draft.includedVarieties} varieties included
              </span>
            </span>
            <span>{formatGHS(draft.packagePrice)}</span>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {draft.varieties.map((v) => (
              <li key={v.id} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                {v.name}
              </li>
            ))}
          </ul>
          {draft.extraVarieties > 0 && (
            <div className="flex justify-between gap-4 text-sm">
              <span>
                {draft.extraVarieties} extra {draft.extraVarieties === 1 ? "variety" : "varieties"}
              </span>
              <span>
                {formatGHS(
                  draft.total -
                    draft.packagePrice -
                    (draft.withTreats ? draft.guests * (draft.total > 0 ? 0 : 0) : 0)
                )}
              </span>
            </div>
          )}
          {draft.withTreats && (
            <p className="text-sm text-muted-foreground">
              Local treats: {draft.treats.map((t) => t.name).join(", ")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">Event date: {draft.eventDate}</p>
        </>
      ) : (
        <ul className="divide-y">
          {items.map((i) => (
            <li key={i.variantId} className="flex justify-between gap-4 py-2.5 text-sm">
              <span>
                {i.name}
                <span className="block text-xs text-muted-foreground">
                  {i.size} × {i.quantity}
                  {i.isPreorder && " · Preorder"}
                </span>
              </span>
              <span>{formatGHS(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-baseline justify-between border-t pt-4">
        <span className="text-muted-foreground">Total</span>
        <span className="font-display text-3xl text-primary">{formatGHS(total)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Transport and taxes are quoted separately.
        {hasPreorder && " Preorder items are prepared to order."}
      </p>
    </div>
  );

  const busy = pending || redirecting;

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-7">
        {/* Mobile summary */}
        <details className="mb-8 rounded-xl border bg-card p-4 lg:hidden">
          <summary className="flex cursor-pointer items-center justify-between font-medium text-primary">
            Order summary
            <span className="font-display text-lg">{formatGHS(total)}</span>
          </summary>
          <div className="mt-4">{summaryBody}</div>
        </details>

        <form onSubmit={onSubmit} className="space-y-10" noValidate>
          <div className="hidden" aria-hidden="true">
            <label>
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          <fieldset className="space-y-5">
            <legend className="mb-1 font-display text-xl font-semibold text-primary">
              Your details
            </legend>
            <Field label="Full name" htmlFor="customer_name" error={errors.customer_name}>
              <Input
                id="customer_name"
                autoComplete="name"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  clearError("customer_name");
                }}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Email" htmlFor="email" error={errors.email}>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError("email");
                  }}
                />
              </Field>
              <Field label="Phone or WhatsApp" htmlFor="phone" error={errors.phone}>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearError("phone");
                  }}
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="mb-1 font-display text-xl font-semibold text-primary">
              {isPackage ? "Event venue" : "Pickup or delivery"}
            </legend>

            {!isPackage && (
              <div className="grid grid-cols-2 gap-2.5">
                {(["pickup", "delivery"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={fulfilment === f}
                    onClick={() => setFulfilment(f)}
                    className={cn(
                      "rounded-xl border p-3.5 text-left text-sm transition-colors",
                      fulfilment === f
                        ? "border-primary bg-secondary"
                        : "bg-card hover:border-primary/50"
                    )}
                  >
                    <span className="block font-medium text-primary">
                      {f === "pickup" ? "Pickup" : "Delivery"}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {f === "pickup" ? "We will confirm the pickup point" : "Delivery cost quoted separately"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {(isPackage || fulfilment === "delivery") && (
              <Field
                label={isPackage ? "Event venue or address" : "Delivery address"}
                htmlFor="delivery_address"
                error={errors.delivery_address}
              >
                <Input
                  id="delivery_address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    clearError("delivery_address");
                  }}
                />
              </Field>
            )}

            {!isPackage && (
              <Field label="Needed by" htmlFor="needed_date" error={errors.needed_date} optional>
                <Input
                  id="needed_date"
                  type="date"
                  value={neededDate}
                  onChange={(e) => {
                    setNeededDate(e.target.value);
                    clearError("needed_date");
                  }}
                  className="max-w-xs"
                />
              </Field>
            )}

            <Field label="Notes" htmlFor="notes" error={errors.notes} optional>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything we should know"
              />
            </Field>
          </fieldset>

          {late && (
            <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
              Your event is less than {minNoticeDays} days away. Late orders may attract additional
              charges, and we will contact you if anything changes.
            </p>
          )}

          <div className="space-y-3 rounded-xl border bg-card p-5">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-primary">
                Read the terms and conditions
              </summary>
              <p className="mt-3 whitespace-pre-line text-muted-foreground">{termsBody}</p>
            </details>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  clearError("accepted_terms");
                }}
                className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
              />
              <span>I have read and accept the terms and conditions.</span>
            </label>
            {errors.accepted_terms && (
              <p className="text-xs text-destructive">{errors.accepted_terms}</p>
            )}
          </div>

          {formError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}

          <div className="space-y-3">
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={busy}>
              {busy ? "Taking you to Paystack..." : `Pay ${formatGHS(total)}`}
            </Button>
            <p className="text-xs text-muted-foreground">
              You will pay securely on Paystack with mobile money or card. Full payment is taken
              now to confirm your order.
            </p>
          </div>
        </form>
      </div>

      <aside className="hidden self-start rounded-2xl border bg-card p-6 lg:sticky lg:top-24 lg:col-span-5 lg:block">
        <h2 className="mb-4 font-display text-xl font-semibold text-primary">Order summary</h2>
        {summaryBody}
      </aside>
    </div>
  );
}
