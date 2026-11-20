import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyRow, KpiCard, PageHeader, TableCard, td, th } from "@/components/admin/ui";
import { formatDate, formatDateTime, formatGHS, whatsappLink } from "@/lib/format";
import Link from "next/link";

export const metadata = { title: "Customers" };

type Customer = {
  email: string;
  name: string;
  phone: string;
  orders: number;
  spent: number;
  bookings: number;
  last: string | null;
  registered: boolean;
  joined: string | null;
  lastSignIn: string | null;
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const q = ((await searchParams).q ?? "").trim().toLowerCase();

  const [orders, bookings, users] = await Promise.all([
    supabase
      .from("orders")
      .select("email, customer_name, phone, total, payment_status, created_at")
      .limit(5000),
    supabase.from("bookings").select("email, customer_name, phone, created_at").limit(5000),
    createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const err = orders.error ?? bookings.error ?? users.error;
  if (err) throw new Error(err.message);

  const map = new Map<string, Customer>();
  const get = (email: string, name: string, phone: string) => {
    const key = email.toLowerCase();
    let c = map.get(key);
    if (!c) {
      c = {
        email: key,
        name,
        phone,
        orders: 0,
        spent: 0,
        bookings: 0,
        last: null,
        registered: false,
        joined: null,
        lastSignIn: null,
      };
      map.set(key, c);
    }
    return c;
  };
  const touch = (c: Customer, iso: string) => {
    if (!c.last || iso > c.last) c.last = iso;
  };

  for (const o of orders.data ?? []) {
    const c = get(o.email, o.customer_name, o.phone);
    if (o.payment_status === "paid") {
      c.orders += 1;
      c.spent += Number(o.total);
    }
    touch(c, o.created_at);
  }
  for (const b of bookings.data ?? []) {
    const c = get(b.email, b.customer_name, b.phone);
    c.bookings += 1;
    touch(c, b.created_at);
  }
  for (const u of users.data?.users ?? []) {
    if (!u.email) continue;
    const c = get(u.email, String(u.user_metadata?.full_name ?? ""), u.phone ?? "");
    if (!c.name) c.name = String(u.user_metadata?.full_name ?? "");
    c.registered = true;
    c.joined = u.created_at;
    c.lastSignIn = u.last_sign_in_at ?? null;
  }

  const all = [...map.values()];
  const rows = all
    .filter(
      (c) =>
        !q ||
        c.email.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\s+/g, "").includes(q.replace(/\s+/g, ""))
    )
    .sort((a, b) => b.spent - a.spent || (b.last ?? "").localeCompare(a.last ?? ""))
    .slice(0, 200);

  const registered = all.filter((c) => c.registered).length;
  const repeat = all.filter((c) => c.orders >= 2).length;

  return (
    <>
      <PageHeader title="Customers" description="Everyone who has ordered, booked or created an account" />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard accent label="Total customers" value={String(all.length)} />
        <KpiCard label="Registered accounts" value={String(registered)} hint="Signed up on the site" />
        <KpiCard label="Repeat buyers" value={String(repeat)} hint="2 or more paid orders" />
      </div>

      <form action="/admin/customers" className="mb-4 mt-6 flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={q} placeholder="Search name, email or phone" className="w-full sm:w-72" />
        <Button type="submit">Search</Button>
        {q && (
          <Link href="/admin/customers" className="text-sm text-muted-foreground underline underline-offset-4">
            Clear
          </Link>
        )}
      </form>

      <TableCard>
        <table className="w-full min-w-[900px]">
          <thead className="bg-muted/60">
            <tr>
              <th className={th}>Customer</th>
              <th className={th}>Phone</th>
              <th className={th}>Paid orders</th>
              <th className={th}>Total spent</th>
              <th className={th}>Bookings</th>
              <th className={th}>Last activity</th>
              <th className={th}>Account</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && <EmptyRow colSpan={7} text="No customers found" />}
            {rows.map((c) => (
              <tr key={c.email} className="hover:bg-muted/40">
                <td className={td}>
                  <span className="font-medium">{c.name || "No name"}</span>
                  <a href={`mailto:${c.email}`} className="block text-xs text-primary hover:underline">
                    {c.email}
                  </a>
                </td>
                <td className={td}>
                  {c.phone ? (
                    <>
                      <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="hover:underline">
                        {c.phone}
                      </a>
                      <a
                        href={whatsappLink(c.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs text-muted-foreground underline underline-offset-4"
                      >
                        WhatsApp
                      </a>
                    </>
                  ) : (
                    "-"
                  )}
                </td>
                <td className={td}>{c.orders}</td>
                <td className={`${td} font-medium`}>{formatGHS(c.spent)}</td>
                <td className={td}>{c.bookings}</td>
                <td className={`${td} whitespace-nowrap text-muted-foreground`}>{formatDateTime(c.last)}</td>
                <td className={td}>
                  {c.registered ? (
                    <>
                      <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Registered
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Joined {formatDate(c.joined)}
                        {c.lastSignIn && ` · Last login ${formatDate(c.lastSignIn)}`}
                      </span>
                    </>
                  ) : (
                    <span className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                      Guest
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </>
  );
}
