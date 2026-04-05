import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { loadDashboardData } from "@/lib/dashboard-data";
import { loadReportsData } from "@/lib/reports-data";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  let today: Awaited<ReturnType<typeof loadDashboardData>>;
  let week: Awaited<ReturnType<typeof loadReportsData>>;
  try {
    [today, week] = await Promise.all([loadDashboardData(), loadReportsData()]);
  } catch {
    return (
      <div className="rounded-[16px] border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200 backdrop-blur-sm">
        Could not load reports. Check your database connection.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
          Reports
        </h1>
        <p className="text-sm text-zinc-500">
          Visual analytics — today vs rolling seven days with live trends.
        </p>
      </div>

      <ReportsDashboard
        daily={week.daily}
        today={{
          saleCount: today.todaySummary.saleCount,
          upiTotal: today.todaySummary.upiTotal,
          cashTotal: today.todaySummary.cashTotal,
        }}
        week={{
          weekSaleCount: week.weekSaleCount,
          weekRevenue: week.weekRevenue,
          weekUpi: week.weekUpi,
          weekCash: week.weekCash,
        }}
      />
    </div>
  );
}
