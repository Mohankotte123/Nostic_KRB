import { InventoryManager } from "@/components/inventory/inventory-manager";
import { loadDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  let data: Awaited<ReturnType<typeof loadDashboardData>>;
  try {
    data = await loadDashboardData();
  } catch {
    return (
      <div className="rounded-[16px] border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200 backdrop-blur-sm">
        Could not load inventory. Check your database connection.
      </div>
    );
  }

  return (
    <InventoryManager
      initialProducts={data.products}
      initialLowStock={data.lowStockProducts}
      initialTodaySummary={data.todaySummary}
      initialFastestFlavor={data.fastestFlavor}
    />
  );
}
