"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { bookingSchema, type BookingInput } from "@/lib/validation/booking";

export type BookingResult =
  | { ok: true; bookingNo: number | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function submitBooking(input: BookingInput): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;

  // Honeypot filled in: pretend it worked, save nothing.
  if (data.website) return { ok: true, bookingNo: null };

  const today = new Date().toISOString().slice(0, 10);
  if (data.event_date < today) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: { event_date: "Event date cannot be in the past" },
    };
  }

  const admin = createAdminClient();

  const { data: terms, error: termsError } = await admin
    .from("terms")
    .select("version")
    .eq("is_current", true)
    .single();

  if (termsError || !terms) {
    console.error("submitBooking: could not load current terms", termsError);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      user_id: user?.id ?? null,
      customer_name: data.customer_name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      service_type: data.service_type,
      event_type: data.event_type,
      event_date: data.event_date,
      guests: data.guests,
      venue: data.venue || null,
      budget_range: data.budget_range || null,
      message: data.message || null,
      terms_version: terms.version,
    })
    .select("booking_no")
    .single();

  if (error || !booking) {
    console.error("submitBooking: insert failed", error);
    return { ok: false, error: "We could not save your request. Please try again." };
  }

  return { ok: true, bookingNo: Number(booking.booking_no) };
}
