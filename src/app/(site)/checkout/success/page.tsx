import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ClearOnSuccess } from "@/components/checkout/clear-on-success";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createAdminClient } from "@/lib/supabase/admin";
import { settlePayment } from "@/lib/paystack/settle";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order status",
  robots: { index: false },
};

type Params = Promise<{ reference?: string; trxref?: string }>;

function Message({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center sm:p-12">
      <h1 className="font-display text-3xl font-semibold text-primary">{title}</h1>
      <p className="mt-4 text-muted-foreground">{text}</p>
      {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

async function Result({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref;

  if (!reference) {
    return (
      <Message title="No payment found" text="We could not find a payment to check.">
        <Link href="/" className={cn(buttonVariants())}>
          Back to home
        </Link>
      </Message>
    );
  }

  const result = await settlePayment(reference);

  if (result.state === "unknown") {
    return (
      <Message title="Payment not found" text="We could not match that payment to an order.">
        <Link href="/contact" className={cn(buttonVariants())}>
          Contact us
        </Link>
      </Message>
    );
  }

  if (result.state === "failed") {
    return (
      <Message
        title="Payment not completed"
        text="Your payment did not go through and you have not been charged. Your cart is still saved, so you can try again."
      >
        <Link href="/checkout" className={cn(buttonVariants())}>
          Try again
        </Link>
        <Link href="/contact" className={cn(buttonVariants({ variant: "outline" }))}>
          Contact us
        </Link>
      </Message>
    );
  }

  if (result.state === "pending") {
    return (
      <Message
        title="Confirming your payment"
        text="We are still waiting for Paystack to confirm your payment. This can take a minute."
      >
        <Link
          href={`/checkout/success?reference=${encodeURIComponent(reference)}`}
          className={cn(buttonVariants())}
        >
          Check again
        </Link>
      </Message>
    );
  }

  // Paid
  if (!result.orderId) {
    return (
      <Message title="Payment received" text="Thank you. We have received your payment.">
        <Link href="/" className={cn(buttonVariants())}>
          Back to home
        </Link>
      </Message>
    );
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "order_no, order_type, total, phone, event_date, order_items(description, quantity, unit_price, line_total)"
    )
    .eq("id", result.orderId)
    .single();

  if (!order) {
    return (
      <Message title="Payment received" text="Thank you. We have received your payment.">
        <Link href="/" className={cn(buttonVariants())}>
          Back to home
        </Link>
      </Message>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <ClearOnSuccess type={order.order_type === "package" ? "package" : "juice"} />
      <div className="rounded-2xl border bg-card p-8 sm:p-10">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--brand-magenta)]">
          Payment received
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-primary">
          Thank you, order #{Number(order.order_no)} is confirmed
        </h1>
        <p className="mt-3 text-muted-foreground">
          We will contact you on {order.phone} to confirm the details
          {order.event_date ? ` for ${order.event_date}` : ""}. Keep your order number handy.
        </p>

        <ul className="mt-8 divide-y border-y">
          {order.order_items.map((item, i) => (
            <li key={i} className="flex justify-between gap-4 py-3 text-sm">
              <span className={Number(item.unit_price) === 0 ? "pl-3 text-muted-foreground" : ""}>
                {item.description}
                {item.quantity > 1 && Number(item.unit_price) > 0 ? ` × ${item.quantity}` : ""}
              </span>
              {Number(item.unit_price) > 0 && <span>{formatGHS(Number(item.line_total))}</span>}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-muted-foreground">Total paid</span>
          <span className="font-display text-2xl text-primary">{formatGHS(Number(order.total))}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className={cn(buttonVariants())}>
          Keep shopping
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage({ searchParams }: { searchParams: Params }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:pt-16">
      <Suspense fallback={<Skeleton className="mx-auto h-80 max-w-xl rounded-2xl" />}>
        <Result searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
