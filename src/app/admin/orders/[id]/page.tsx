import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader, Panel, StatusBadge, fieldClass } from "@/components/admin/ui";
import { formatDateTime, formatGHS, whatsappLink } from "@/lib/format";
import { recheckPayment, updateOrderStatus } from "../actions";

export const metadata = { title: "Order" };

const STATUSES = ["new", "confirmed", "preparing", "ready", "delivered", "cancelled"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-2.5 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right">{children}</dd>
    </div>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  if (!UUID.test(id)) notFound();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*), payments(*)")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const items = [...order.order_items];
  const payments = [...order.payments].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <>
      <PageHeader
        title={`Order #${order.order_no}`}
        description={`Placed ${formatDateTime(order.created_at)}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge value={order.payment_status} />
            <StatusBadge value={order.status} />
            <Link href="/admin/orders" className="ml-2 text-sm text-primary underline underline-offset-4">
              All orders
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Panel title="Items">
            <ul className="divide-y">
              {items.map((it) => {
                const free = Number(it.unit_price) === 0;
                return (
                  <li key={it.id} className="flex justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0">
                    <span className={free ? "pl-4 text-muted-foreground" : ""}>
                      {it.description}
                      {it.quantity > 1 && !free && (
                        <span className="text-muted-foreground"> × {it.quantity}</span>
                      )}
                    </span>
                    {!free && <span>{formatGHS(Number(it.line_total ?? 0))}</span>}
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t pt-4">
              <span className="text-muted-foreground">Total</span>
              <span className="font-display text-2xl text-primary">{formatGHS(Number(order.total))}</span>
            </div>
          </Panel>

          <Panel title="Payments" description="Paystack transactions for this order">
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment attempts yet</p>
            ) : (
              <ul className="divide-y">
                {payments.map((p) => (
                  <li key={p.id} className="space-y-1.5 py-3 text-sm first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{formatGHS(Number(p.amount))}</span>
                      <StatusBadge value={p.status} />
                    </div>
                    <p className="break-all font-mono text-xs text-muted-foreground">{p.reference}</p>
                    <p className="text-xs text-muted-foreground">
                      Started {formatDateTime(p.created_at)}
                      {p.paid_at && ` · Paid ${formatDateTime(p.paid_at)}`}
                      {p.channel && ` · ${p.channel.replace("_", " ")}`}
                    </p>
                    {p.status !== "paid" && (
                      <form action={recheckPayment} className="pt-1">
                        <input type="hidden" name="id" value={order.id} />
                        <input type="hidden" name="reference" value={p.reference} />
                        <Button type="submit" size="sm" variant="outline">
                          Re-check with Paystack
                        </Button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Update status">
            <form action={updateOrderStatus} className="flex gap-2">
              <input type="hidden" name="id" value={order.id} />
              <select name="status" defaultValue={order.status} className={`${fieldClass} flex-1 capitalize`}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Button type="submit">Save</Button>
            </form>
          </Panel>

          <Panel title="Customer">
            <dl className="divide-y">
              <Row label="Name">{order.customer_name}</Row>
              <Row label="Email">
                <a href={`mailto:${order.email}`} className="text-primary underline underline-offset-4">
                  {order.email}
                </a>
              </Row>
              <Row label="Phone">
                <a href={`tel:${order.phone.replace(/\s+/g, "")}`} className="text-primary underline underline-offset-4">
                  {order.phone}
                </a>
                <a
                  href={whatsappLink(order.phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 block text-xs text-muted-foreground underline underline-offset-4"
                >
                  Open WhatsApp
                </a>
              </Row>
              <Row label="Type">
                <span className="capitalize">{order.order_type}</span>
              </Row>
              <Row label="Fulfilment">
                <span className="capitalize">{order.fulfilment}</span>
              </Row>
              {order.delivery_address && <Row label="Address">{order.delivery_address}</Row>}
              {order.event_date && <Row label="Event or needed date">{order.event_date}</Row>}
              {order.guests && <Row label="Guests">{order.guests}</Row>}
              {order.is_late_order && <Row label="Notice">Late order (under 2 weeks)</Row>}
              {order.notes && <Row label="Notes">{order.notes}</Row>}
              <Row label="Terms">
                v{order.terms_version}, accepted {formatDateTime(order.terms_accepted_at)}
              </Row>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
