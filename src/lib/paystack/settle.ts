import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { verifyTransaction } from "./server";

export type SettleResult = {
  state: "paid" | "failed" | "pending" | "unknown";
  orderId: string | null;
  bookingId: string | null;
};

type Admin = ReturnType<typeof createAdminClient>;

async function markFailed(
  admin: Admin,
  paymentId: string,
  ids: { orderId: string | null; bookingId: string | null }
) {
  await admin.from("payments").update({ status: "failed" }).eq("id", paymentId);
  if (ids.orderId) {
    await admin.from("orders").update({ payment_status: "failed" }).eq("id", ids.orderId);
  }
  if (ids.bookingId) {
    await admin.from("bookings").update({ payment_status: "failed" }).eq("id", ids.bookingId);
  }
}

// Verifies a Paystack reference and updates the payment, order or booking.
// Safe to call many times: the success page and the webhook both use it.
export async function settlePayment(reference: string): Promise<SettleResult> {
  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("id, order_id, booking_id, amount, status")
    .eq("reference", reference)
    .maybeSingle();

  if (!payment) return { state: "unknown", orderId: null, bookingId: null };

  const ids = { orderId: payment.order_id, bookingId: payment.booking_id };
  if (payment.status === "paid") return { state: "paid", ...ids };

  let tx;
  try {
    tx = await verifyTransaction(reference);
  } catch (err) {
    console.error("settlePayment: verify failed", reference, err);
    return { state: "pending", ...ids };
  }

  if (tx.status === "success") {
    const expected = Math.round(Number(payment.amount) * 100);
    if (tx.amount !== expected || tx.currency !== "GHS") {
      console.error("settlePayment: amount mismatch", {
        reference,
        expected,
        received: tx.amount,
        currency: tx.currency,
      });
      await markFailed(admin, payment.id, ids);
      return { state: "failed", ...ids };
    }

    await admin
      .from("payments")
      .update({
        status: "paid",
        channel: tx.channel,
        paid_at: tx.paid_at ?? new Date().toISOString(),
        raw: tx as unknown as Json,
      })
      .eq("id", payment.id);

    if (ids.orderId) {
      await admin
        .from("orders")
        .update({ payment_status: "paid", status: "confirmed" })
        .eq("id", ids.orderId);
    }
    if (ids.bookingId) {
      await admin
        .from("bookings")
        .update({ payment_status: "paid", status: "paid" })
        .eq("id", ids.bookingId);
    }
    return { state: "paid", ...ids };
  }

  if (tx.status === "failed") {
    await markFailed(admin, payment.id, ids);
    return { state: "failed", ...ids };
  }

  return { state: "pending", ...ids };
}
