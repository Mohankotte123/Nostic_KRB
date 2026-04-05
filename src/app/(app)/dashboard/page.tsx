import { IndianRupee } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loadDashboardData } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let data: Awaited<ReturnType<typeof loadDashboardData>>;
  try {
    data = await loadDashboardData();
  } catch (err) {
    const detail =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : null;
    return (
      <div className="space-y-3 rounded-[16px] border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200 backdrop-blur-sm">
        <p className="font-medium text-amber-100">
          Could not load dashboard data. Check your database connection.
        </p>
        <ul className="list-inside list-disc space-y-1 text-amber-200/90 text-xs leading-relaxed">
          <li>
            Set <code className="rounded bg-black/30 px-1 py-0.5">MONGODB_URI</code>{" "}
            in <code className="rounded bg-black/30 px-1 py-0.5">.env.local</code>{" "}
            (see <code className="rounded bg-black/30 px-1 py-0.5">.env.example</code>
            ). Use a full Atlas URI including the database name before{" "}
            <code className="rounded bg-black/30 px-1 py-0.5">?</code>.
          </li>
          <li>
            In Atlas: verify the database user password and that{" "}
            <strong className="font-semibold">Network Access</strong> allows your
            current IP.
          </li>
        </ul>
        {detail ? (
          <pre className="max-h-40 overflow-auto rounded-[12px] border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-zinc-300 whitespace-pre-wrap">
            {detail}
          </pre>
        ) : null}
      </div>
    );
  }

  const { todaySummary, fastestFlavor, lowStockProducts } = data;

  const salesCard = "border-t-[3px] border-t-[#6366F1]";
  const fastestCard = "border-t-[3px] border-t-[#10B981]";
  const stockCard = "border-t-[3px] border-t-[#F59E0B]";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
          Overview
        </h1>
        <p className="text-sm text-zinc-500">
          Today&apos;s performance at a glance. Use the bell for low-stock
          alerts.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className={cn(salesCard)}>
          <CardHeader className="pb-2">
            <CardDescription>Sales today (UPI)</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-emerald-400 tabular-nums">
              <IndianRupee className="size-5 text-indigo-400/90" />
              {formatMoney(todaySummary.upiTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn(salesCard)}>
          <CardHeader className="pb-2">
            <CardDescription>Sales today (Cash)</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-emerald-400 tabular-nums">
              <IndianRupee className="size-5 text-indigo-400/90" />
              {formatMoney(todaySummary.cashTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn(salesCard)}>
          <CardHeader className="pb-2">
            <CardDescription>Orders today</CardDescription>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-indigo-300 tabular-nums">
              {todaySummary.saleCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn(fastestCard)}>
          <CardHeader className="pb-2">
            <CardDescription>Fastest selling (today)</CardDescription>
            <CardTitle className="text-lg font-bold leading-snug text-white">
              {fastestFlavor ? (
                <>
                  <span className="font-extrabold">{fastestFlavor.name}</span>
                  <span className="mt-1 block text-sm font-medium text-zinc-500">
                    {fastestFlavor.unitsSold} units
                  </span>
                </>
              ) : (
                <span className="font-normal text-zinc-500">No sales yet</span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card className={cn(stockCard)}>
        <CardHeader>
          <CardTitle>Stock health</CardTitle>
          <CardDescription>
            {lowStockProducts.length === 0
              ? "All tracked SKUs are above their low-stock threshold."
              : `${lowStockProducts.length} product(s) below threshold — open the alerts bell or filter Inventory.`}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
