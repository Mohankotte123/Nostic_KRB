import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth/session";
import { loadDashboardData } from "@/lib/dashboard-data";
import type { ProductDTO } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  let lowStockProducts: ProductDTO[] = [];
  try {
    lowStockProducts = (await loadDashboardData()).lowStockProducts;
  } catch {
    /* DB unavailable — shell still renders; data pages may show errors */
  }

  return (
    <AppShell session={session} lowStockProducts={lowStockProducts}>
      {children}
    </AppShell>
  );
}
