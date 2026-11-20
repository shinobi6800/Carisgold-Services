import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/admin/auth";
import { one } from "@/lib/admin/util";
import {
  EmptyRow,
  KpiCard,
  PageHeader,
  StatusBadge,
  TableCard,
  fieldClass,
  td,
  th,
} from "@/components/admin/ui";
import { formatDateTime, formatGHS } from "@/lib/format";

export const metadata = { title: "Transactions" };

const PAGE_SIZE = 25;
const STATUSES = ["pending", "paid", "failed", "refunded"] as const;

type SearchParams = Promise<{ q?: string; status?: string; page?: string }>;

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;

  const q = (sp.q ?? "").trim().replace(/[%,()*]/g, "").slice(0, 60);
  const status = STATUSES.find((s) => s === sp.status);
  const page = Math.max(1, Number(sp.page) || 1);

  let query = supabase
    .from("payments")
    .select(
      "id, reference, amount, status, channel, paid_at, created_at, order_id, booking_id, orders(order_no, customer_name, email), bookings(booking_no, customer_name, email)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("reference", `%${q}%`);

  const [list, summary] = await Promise.all([
    query,
    supabase.from("payments").select("amount, status").limit(5000),
  ]);
  if (list.error) throw new Error(list.error.message);

  let paidTotal = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  for (const p of summary.data ?? []) {
    if (p.status === "paid") {
      paidTotal += Number(p.amount);
      paidCount += 1;
    } else if (p.status === "pending") pendingCount += 1;
    else if (p.status === "failed") failedCount += 1;
  }

  const pages = Math.max(1, Math.ceil((list.count ?? 0) / PAGE_SIZE));
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/transactions${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Transactions" description="Every Paystack payment attempt, with date and time" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard accent label="Collected" value={formatGHS(paidTotal)} hint="Paid transactions" />
        <KpiCard label="Successful" value={String(paidCount)} />
        <KpiCard label="Pending" value={String(pendingCount)} hint="Started, not paid" />
        <KpiCard label="Failed" value={String(failedCount)} />
      </div>

      <form action="/admin/transactions" className="mb-4 mt-6 flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={q} placeholder="Search by Paystack reference" className="w-full sm:w-72" />
        <select name="status" defaultValue={status ?? ""} className={fieldClass}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button type="submit">Filter</Button>
        {(q || status) && (
          <Link href="/admin/transactions" className="text-sm text-muted-foreground underline underline-offset-4">
            Clear
          </Link>
        )}
      </form>

      <TableCard>
        <table className="w-full min-w-[900px]">
          <thead className="bg-muted/60">
            <tr>
              <th className={th}>Started</th>
              <th className={th}>Reference</th>
              <th className={th}>Customer</th>
              <th className={th}>For</th>
              <th className={th}>Amount</th>
              <th className={th}>Channel</th>
              <th className={th}>Paid at</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(list.data ?? []).length === 0 && <EmptyRow colSpan={8} text="No transactions found" />}
            {(list.data ?? []).map((p) => {
              const o = one(p.orders);
              const b = one(p.bookings);
              const who = o ?? b;
              return (
                <tr key={p.id} className="hover:bg-muted/40">
                  <td className={`${td} whitespace-nowrap text-muted-foreground`}>
                    {formatDateTime(p.created_at)}
                  </td>
                  <td className={`${td} font-mono text-xs`}>{p.reference}</td>
                  <td className={td}>
                    {who?.customer_name ?? "-"}
                    <span className="block text-xs text-muted-foreground">{who?.email}</span>
                  </td>
                  <td className={td}>
                    {o && p.order_id ? (
                      <Link href={`/admin/orders/${p.order_id}`} className="text-primary hover:underline">
                        Order #{o.order_no}
                      </Link>
                    ) : b ? (
                      <span>Booking #{b.booking_no}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className={`${td} font-medium`}>{formatGHS(Number(p.amount))}</td>
                  <td className={`${td} capitalize`}>{p.channel?.replace("_", " ") ?? "-"}</td>
                  <td className={`${td} whitespace-nowrap text-muted-foreground`}>
                    {formatDateTime(p.paid_at)}
                  </td>
                  <td className={td}>
                    <StatusBadge value={p.status} />
                  </td>
                </tr>
              );
            })}
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
