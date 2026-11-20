import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/auth";
import { EmptyRow, PageHeader, StatusBadge, TableCard, fieldClass, td, th } from "@/components/admin/ui";
import { formatDateTime, formatGHS } from "@/lib/format";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 20;
const ORDER_STATUSES = ["new", "confirmed", "preparing", "ready", "delivered", "cancelled"] as const;
const PAY_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

type SearchParams = Promise<{ q?: string; status?: string; pay?: string; page?: string }>;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;

  const q = (sp.q ?? "").trim().replace(/[,()%*#]/g, "").slice(0, 60);
  const status = ORDER_STATUSES.find((s) => s === sp.status);
  const pay = PAY_STATUSES.find((s) => s === sp.pay);
  const page = Math.max(1, Number(sp.page) || 1);

  let query = supabase
    .from("orders")
    .select(
      "id, order_no, order_type, customer_name, email, total, status, payment_status, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (status) query = query.eq("status", status);
  if (pay) query = query.eq("payment_status", pay);
  if (q) {
    const n = Number(q);
    query =
      Number.isInteger(n) && n > 0
        ? query.or(`order_no.eq.${n},customer_name.ilike.%${q}%,email.ilike.%${q}%`)
        : query.or(`customer_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data: orders, count, error } = await query;
  if (error) throw new Error(error.message);

  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (pay) u.set("pay", pay);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Orders" description={`${count ?? 0} orders`} />

      <form action="/admin/orders" className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name, email or order number"
          className="w-full sm:w-72"
        />
        <select name="pay" defaultValue={pay ?? ""} className={fieldClass}>
          <option value="">All payments</option>
          {PAY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className={fieldClass}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button type="submit">Filter</Button>
        {(q || status || pay) && (
          <Link href="/admin/orders" className="text-sm text-muted-foreground underline underline-offset-4">
            Clear
          </Link>
        )}
      </form>

      <TableCard>
        <table className="w-full min-w-[820px]">
          <thead className="bg-muted/60">
            <tr>
              <th className={th}>Order</th>
              <th className={th}>Date and time</th>
              <th className={th}>Customer</th>
              <th className={th}>Type</th>
              <th className={th}>Total</th>
              <th className={th}>Payment</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(orders ?? []).length === 0 && <EmptyRow colSpan={7} text="No orders match your filters" />}
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="hover:bg-muted/40">
                <td className={td}>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-primary hover:underline">
                    #{o.order_no}
                  </Link>
                </td>
                <td className={`${td} whitespace-nowrap text-muted-foreground`}>
                  {formatDateTime(o.created_at)}
                </td>
                <td className={td}>
                  {o.customer_name}
                  <span className="block text-xs text-muted-foreground">{o.email}</span>
                </td>
                <td className={`${td} capitalize`}>{o.order_type}</td>
                <td className={`${td} font-medium`}>{formatGHS(Number(o.total))}</td>
                <td className={td}>
                  <StatusBadge value={o.payment_status} />
                </td>
                <td className={td}>
                  <StatusBadge value={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href(page - 1)} className="rounded-md border bg-card px-3 py-1.5 hover:bg-muted">
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={href(page + 1)} className="rounded-md border bg-card px-3 py-1.5 hover:bg-muted">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
