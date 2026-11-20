import { NextResponse } from "next/server";
import { isValidWebhookSignature } from "@/lib/paystack/server";
import { settlePayment } from "@/lib/paystack/settle";

export async function POST(request: Request) {
  const raw = await request.text();

  if (!isValidWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "charge.success" && typeof event.data?.reference === "string") {
    await settlePayment(event.data.reference);
  }

  return NextResponse.json({ received: true });
}
