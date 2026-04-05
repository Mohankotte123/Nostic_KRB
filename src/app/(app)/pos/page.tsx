import { PosTerminal } from "@/components/pos/pos-terminal";
import { loadDashboardData } from "@/lib/dashboard-data";
import { getFranchiseDetails } from "@/lib/franchise-details";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  let data: Awaited<ReturnType<typeof loadDashboardData>>;
  try {
    data = await loadDashboardData();
  } catch {
    return (
      <div className="rounded-[16px] border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200 backdrop-blur-sm">
        Could not load products. Check your database connection.
      </div>
    );
  }

  const franchise = getFranchiseDetails();

  return (
    <PosTerminal
      franchise={franchise}
      initialProducts={data.products}
      initialLowStock={data.lowStockProducts}
      initialTodaySummary={data.todaySummary}
      initialFastestFlavor={data.fastestFlavor}
    />
  );
}
