import { cn } from "@/lib/utils";

export const fieldClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40";
export const th =
  "px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap";
export const td = "px-5 py-3.5 text-sm";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card shadow-sm", className)}>
      {title && (
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  delta,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: number | null;
  accent?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {accent && <div className="bg-brand-gradient h-1 w-full" />}
      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 font-display text-2xl font-semibold md:text-3xl">{value}</p>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
          {delta !== undefined && delta !== null && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-medium",
                delta >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              )}
            >
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(0)}%
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      </div>
    </div>
  );
}

const TONES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  delivered: "bg-emerald-100 text-emerald-700",
  completed: "bg-emerald-100 text-emerald-700",
  accepted: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  new: "bg-orange-100 text-orange-700",
  quoted: "bg-sky-100 text-sky-700",
  preparing: "bg-sky-100 text-sky-700",
  ready: "bg-sky-100 text-sky-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-zinc-200 text-zinc-700",
  refunded: "bg-zinc-200 text-zinc-700",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        TONES[value] ?? "bg-zinc-100 text-zinc-700"
      )}
    >
      {value}
    </span>
  );
}

export function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center text-sm text-muted-foreground">
        {text}
      </td>
    </tr>
  );
}
