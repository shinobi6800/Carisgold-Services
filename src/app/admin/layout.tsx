import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/admin-gate";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | CarisGold Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/40" />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
