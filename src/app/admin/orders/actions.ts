"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { settlePayment } from "@/lib/paystack/settle";

const STATUSES = ["new", "confirmed", "preparing", "ready", "delivered", "cancelled"] as const;

function refresh(id: string) {
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/transactions");
  revalidatePath("/admin");
}

export async function updateOrderStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = STATUSES.find((s) => s === formData.get("status"));
  if (!id || !status) return;

  await supabase.from("orders").update({ status }).eq("id", id);
  refresh(id);
}

// Asks Paystack for the real result of a payment and updates our records.
export async function recheckPayment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const reference = String(formData.get("reference") ?? "");
  if (reference) await settlePayment(reference);
  refresh(id);
}
