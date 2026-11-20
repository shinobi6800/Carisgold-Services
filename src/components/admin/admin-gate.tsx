import { requireAdmin } from "@/lib/admin/auth";
import { AdminShell } from "./admin-shell";

export async function AdminGate({ children }: { children: React.ReactNode }) {
  const { name } = await requireAdmin();
  return <AdminShell name={name}>{children}</AdminShell>;
}
