import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getDashboardStats } from "@/lib/admin/stats";
import {
  DailyRevenueChart,
  MonthlyRevenueChart,
  RevenueSplitChart,
  TopProductsChart,
} from "@/components/admin/charts";
import {
  EmptyRow,
  KpiCard,
  PageHeader,
  Panel,
  StatusBadge,
  TableCard,
  td,
  th,
} from "@/components/admin/ui";
import { formatDate, formatDateTime, formatGHS } from "@/lib/format";

export const metadata = { title: "Overview" };

const SERVICE_LABEL: Record<string, string> = {
  event_management: "Event management",
  decor: "Decor and styling",
  event_management_and_decor: "Management and decor",
};

export default async function AdminOverviewPage() {
  const { supabase, name } = await requireAdmin();
  const s = await getDashboardStats(supabase);

  const firstName = name.split(/[ @]/)[0];
  const maxPicks = Math.max(1, ...s.packagePicks.map((p) => p.picks));

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={`${formatDate(new Date().toISOString())} · All times are Ghana time`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard accent label="Total revenue" value={formatGHS(s.totalRevenue)} hint="All paid orders" />
        <KpiCard
          accent
          label="This month"
          value={formatGHS(s.thisMonth)}
          delta={s.monthDelta}
          hint={s.monthDelta === null ? "No sales last month" : "vs last month"}
        />
        <KpiCard accent label="Paid orders" value={String(s.paidOrders)} hint={`Average ${formatGHS(s.avgOrder)}`} />
        <KpiCard
          accent
          label="Customers"
          value={String(s.customers)}
          hint={`${s.registered} registered accounts`}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <KpiCard label="Pending payments" value={String(s.pendingPayments)} hint="Checkouts not yet paid" />
        <KpiCard label="New booking requests" value={String(s.newBookings)} hint="Waiting for a quote" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Monthly revenue"
          description="Paid revenue for the last 12 months. The current month is orange."
        >
          <MonthlyRevenueChart data={s.monthly} />
        </Panel>
        <Panel title="Revenue by type" description="Juice orders, event packages and event bookings">
          <RevenueSplitChart data={s.split} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Last 30 days" description="Daily paid revenue">
          <DailyRevenueChart data={s.daily} />
        </Panel>
        <Panel title="Top sellers" description="Shop revenue by product">
          <TopProductsChart data={s.topProducts} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary underline underline-offset-4">
              View all
            </Link>
          </div>
          <TableCard>
            <table className="w-full min-w-[560px]">
              <thead className="bg-muted/60">
                <tr>
                  <th className={th}>Order</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Total</th>
                  <th className={th}>Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {s.recentOrders.length === 0 && <EmptyRow colSpan={4} text="No orders yet" />}
                {s.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/40">
                    <td className={td}>
                      <Link href={`/admin/orders/${o.id}`} className="font-medium text-primary hover:underline">
                        #{o.order_no}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {formatDateTime(o.created_at)}
                      </span>
                    </td>
                    <td className={td}>
                      {o.customer_name}
                      <span className="block text-xs text-muted-foreground">{o.email}</span>
                    </td>
                    <td className={`${td} font-medium`}>{formatGHS(Number(o.total))}</td>
                    <td className={td}>
                      <StatusBadge value={o.payment_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </div>

        <div className="space-y-4">
          <Panel title="Booking requests" description="Latest event enquiries">
            {s.recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests yet</p>
            ) : (
              <ul className="divide-y">
                {s.recentBookings.map((b) => (
                  <li key={b.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {SERVICE_LABEL[b.service_type] ?? b.service_type} · {formatDate(b.event_date)}
                      </p>
                    </div>
                    <StatusBadge value={b.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Popular in packages" description="Most picked varieties">
            {s.packagePicks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No package orders yet</p>
            ) : (
              <ul className="space-y-3">
                {s.packagePicks.map((p) => (
                  <li key={p.name}>
                    <div className="flex justify-between text-sm">
                      <span>{p.name}</span>
                      <span className="text-muted-foreground">{p.picks}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="bg-brand-gradient h-full rounded-full"
                        style={{ width: `${(p.picks / maxPicks) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
