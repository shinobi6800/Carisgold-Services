import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { one } from "./util";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type DashboardStats = {
  totalRevenue: number;
  thisMonth: number;
  lastMonth: number;
  monthDelta: number | null;
  paidOrders: number;
  avgOrder: number;
  pendingPayments: number;
  newBookings: number;
  customers: number;
  registered: number;
  monthly: { label: string; revenue: number }[];
  daily: { label: string; revenue: number }[];
  split: { name: string; value: number }[];
  topProducts: { name: string; revenue: number; units: number }[];
  packagePicks: { name: string; picks: number }[];
  recentOrders: {
    id: string;
    order_no: number;
    customer_name: string;
    email: string;
    total: number;
    status: string;
    payment_status: string;
    created_at: string;
  }[];
  recentBookings: {
    id: string;
    booking_no: number;
    customer_name: string;
    service_type: string;
    event_date: string;
    status: string;
    created_at: string;
  }[];
};

const short = (name: string) => (name.length > 22 ? `${name.slice(0, 21)}…` : name);

export async function getDashboardStats(supabase: Supabase): Promise<DashboardStats> {
  const now = new Date();

  const [payments, orders, bookings, items, profiles, recentOrders, recentBookings] =
    await Promise.all([
      supabase
        .from("payments")
        .select("amount, paid_at, order_id, booking_id, orders(order_type)")
        .eq("status", "paid")
        .not("paid_at", "is", null)
        .limit(5000),
      supabase.from("orders").select("email, payment_status").limit(5000),
      supabase.from("bookings").select("email, status").limit(5000),
      supabase
        .from("order_items")
        .select("product_id, item_type, quantity, line_total, products(name), orders!inner(payment_status)")
        .eq("orders.payment_status", "paid")
        .in("item_type", ["variant", "package_variety"])
        .limit(5000),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("id, order_no, customer_name, email, total, status, payment_status, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("bookings")
        .select("id, booking_no, customer_name, service_type, event_date, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const failed = [payments, orders, bookings, items, profiles, recentOrders, recentBookings].find(
    (r) => r.error
  );
  if (failed?.error) throw new Error(failed.error.message);

  // Month and day buckets (Ghana is UTC+0, so UTC dates are local dates)
  const monthKeys = Array.from({ length: 12 }, (_, idx) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - idx), 1));
    return {
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`,
    };
  });
  const dayKeys = Array.from({ length: 30 }, (_, idx) => {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (29 - idx))
    );
    return { key: d.toISOString().slice(0, 10), label: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}` };
  });
  const byMonth = new Map(monthKeys.map((m) => [m.key, 0]));
  const byDay = new Map(dayKeys.map((d) => [d.key, 0]));

  let totalRevenue = 0;
  let orderRevenue = 0;
  let orderPayments = 0;
  const split = { juice: 0, package: 0, booking: 0 };

  for (const p of payments.data ?? []) {
    const amount = Number(p.amount);
    totalRevenue += amount;
    const day = (p.paid_at ?? "").slice(0, 10);
    const month = day.slice(0, 7);
    if (byMonth.has(month)) byMonth.set(month, (byMonth.get(month) ?? 0) + amount);
    if (byDay.has(day)) byDay.set(day, (byDay.get(day) ?? 0) + amount);

    if (p.order_id) {
      orderRevenue += amount;
      orderPayments += 1;
      if (one(p.orders)?.order_type === "package") split.package += amount;
      else split.juice += amount;
    } else if (p.booking_id) {
      split.booking += amount;
    }
  }

  const thisMonth = byMonth.get(monthKeys[11].key) ?? 0;
  const lastMonth = byMonth.get(monthKeys[10].key) ?? 0;

  // Product sales
  const sold = new Map<string, { name: string; revenue: number; units: number }>();
  const picks = new Map<string, { name: string; picks: number }>();
  for (const it of items.data ?? []) {
    if (!it.product_id) continue;
    const name = one(it.products)?.name ?? "Unknown";
    if (it.item_type === "variant") {
      const row = sold.get(it.product_id) ?? { name, revenue: 0, units: 0 };
      row.revenue += Number(it.line_total ?? 0);
      row.units += it.quantity;
      sold.set(it.product_id, row);
    } else {
      const row = picks.get(it.product_id) ?? { name, picks: 0 };
      row.picks += 1;
      picks.set(it.product_id, row);
    }
  }

  const emails = new Set<string>();
  for (const o of orders.data ?? []) emails.add(o.email.toLowerCase());
  for (const b of bookings.data ?? []) emails.add(b.email.toLowerCase());

  return {
    totalRevenue,
    thisMonth,
    lastMonth,
    monthDelta: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null,
    paidOrders: (orders.data ?? []).filter((o) => o.payment_status === "paid").length,
    avgOrder: orderPayments > 0 ? orderRevenue / orderPayments : 0,
    pendingPayments: (orders.data ?? []).filter((o) => o.payment_status === "pending").length,
    newBookings: (bookings.data ?? []).filter((b) => b.status === "new").length,
    customers: emails.size,
    registered: profiles.count ?? 0,
    monthly: monthKeys.map((m) => ({ label: m.label, revenue: byMonth.get(m.key) ?? 0 })),
    daily: dayKeys.map((d) => ({ label: d.label, revenue: byDay.get(d.key) ?? 0 })),
    split: [
      { name: "Juice orders", value: split.juice },
      { name: "Event packages", value: split.package },
      { name: "Event bookings", value: split.booking },
    ],
    topProducts: [...sold.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
      .map((p) => ({ ...p, name: short(p.name) })),
    packagePicks: [...picks.values()]
      .sort((a, b) => b.picks - a.picks)
      .slice(0, 6)
      .map((p) => ({ ...p, name: short(p.name) })),
    recentOrders: recentOrders.data ?? [],
    recentBookings: recentBookings.data ?? [],
  };
}
