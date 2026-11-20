"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitBooking } from "@/app/(site)/book/actions";
import { BUDGET_RANGES, EVENT_TYPES, SERVICE_TYPES, type BookingInput } from "@/lib/validation/booking";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40";

type FormState = {
  service_type: BookingInput["service_type"];
  event_type: string;
  event_date: string;
  guests: string;
  venue: string;
  budget_range: string;
  message: string;
  customer_name: string;
  email: string;
  phone: string;
  accepted_terms: boolean;
  website: string;
};

const initial: FormState = {
  service_type: "event_management",
  event_type: "",
  event_date: "",
  guests: "",
  venue: "",
  budget_range: "",
  message: "",
  customer_name: "",
  email: "",
  phone: "",
  accepted_terms: false,
  website: "",
};

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

export function BookingForm({
  termsBody,
  minNoticeDays,
}: {
  termsBody: string;
  minNoticeDays: number;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<{ bookingNo: number | null; email: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  let late = false;
  if (form.event_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round(
      (new Date(`${form.event_date}T00:00:00`).getTime() - today.getTime()) / 86400000
    );
    late = days >= 0 && days < minNoticeDays;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const guests = form.guests.trim() === "" ? null : Number(form.guests);
    if (guests !== null && (!Number.isInteger(guests) || guests < 1)) {
      setErrors({ guests: "Enter a valid number" });
      return;
    }
    if (!form.event_type) {
      setErrors({ event_type: "Choose the type of event" });
      return;
    }

    startTransition(async () => {
      const result = await submitBooking({
        service_type: form.service_type,
        event_type: form.event_type as BookingInput["event_type"],
        event_date: form.event_date,
        guests,
        venue: form.venue,
        budget_range: form.budget_range,
        message: form.message,
        customer_name: form.customer_name,
        email: form.email,
        phone: form.phone,
        accepted_terms: form.accepted_terms,
        website: form.website,
      });

      if (result.ok) {
        setDone({ bookingNo: result.bookingNo, email: form.email });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error);
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center sm:p-12">
        <h2 className="font-display text-3xl font-semibold text-primary">Request received</h2>
        {done.bookingNo ? (
          <p className="mt-2 text-sm text-muted-foreground">Reference #{done.bookingNo}</p>
        ) : null}
        <p className="mx-auto mt-5 max-w-md text-muted-foreground">
          Thank you. We will review your details and send a quote to{" "}
          <span className="font-medium text-foreground">{done.email}</span>. Once you accept it,
          you pay the quoted amount in full online to confirm your date.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={cn(buttonVariants())}>
            Back to home
          </Link>
          <Link href="/shop" className={cn(buttonVariants({ variant: "outline" }))}>
            Browse the shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10" noValidate>
      {/* Honeypot: hidden from people, visible to bots */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </label>
      </div>

      {/* Service */}
      <fieldset className="space-y-3">
        <legend className="font-display text-xl font-semibold text-primary">
          What do you need?
        </legend>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {SERVICE_TYPES.map((s) => {
            const on = form.service_type === s.value;
            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={on}
                onClick={() => set("service_type", s.value)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors",
                  on ? "border-primary bg-secondary" : "bg-card hover:border-primary/50"
                )}
              >
                <span className="block font-medium text-primary">{s.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{s.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Event details */}
      <fieldset className="space-y-5">
        <legend className="mb-1 font-display text-xl font-semibold text-primary">
          About your event
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Type of event" htmlFor="event_type" error={errors.event_type}>
            <select
              id="event_type"
              value={form.event_type}
              onChange={(e) => set("event_type", e.target.value)}
              className={selectClass}
            >
              <option value="">Select</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Event date" htmlFor="event_date" error={errors.event_date}>
            <Input
              id="event_date"
              type="date"
              value={form.event_date}
              onChange={(e) => set("event_date", e.target.value)}
            />
          </Field>
        </div>

        {late && (
          <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
            Your event is less than {minNoticeDays} days away. We ask for at least two clear weeks
            notice, and late orders may attract additional charges.
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Number of guests" htmlFor="guests" error={errors.guests} optional>
            <Input
              id="guests"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.guests}
              onChange={(e) => set("guests", e.target.value)}
            />
          </Field>

          <Field label="Budget" htmlFor="budget_range" optional>
            <select
              id="budget_range"
              value={form.budget_range}
              onChange={(e) => set("budget_range", e.target.value)}
              className={selectClass}
            >
              <option value="">Select</option>
              {BUDGET_RANGES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Venue or location" htmlFor="venue" error={errors.venue} optional>
          <Input
            id="venue"
            value={form.venue}
            onChange={(e) => set("venue", e.target.value)}
            placeholder="Venue name or area"
          />
        </Field>

        <Field label="Tell us more" htmlFor="message" error={errors.message} optional>
          <Textarea
            id="message"
            rows={4}
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="Theme, colours, ideas, anything we should know"
          />
        </Field>
      </fieldset>

      {/* Contact */}
      <fieldset className="space-y-5">
        <legend className="mb-1 font-display text-xl font-semibold text-primary">
          Your details
        </legend>
        <Field label="Full name" htmlFor="customer_name" error={errors.customer_name}>
          <Input
            id="customer_name"
            autoComplete="name"
            value={form.customer_name}
            onChange={(e) => set("customer_name", e.target.value)}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Phone or WhatsApp" htmlFor="phone" error={errors.phone}>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
        </div>
      </fieldset>

      {/* Terms */}
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
            checked={form.accepted_terms}
            onChange={(e) => set("accepted_terms", e.target.checked)}
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

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Sending..." : "Send request"}
      </Button>
    </form>
  );
}
