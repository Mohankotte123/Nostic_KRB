import "server-only";

import type { ReportDayBucket } from "@/lib/reports-types";
import { connectDB } from "@/lib/mongodb";
import { ensureSeedProducts } from "@/lib/seed-products";
import { Sale } from "@/models/Sale";

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function loadReportsData(): Promise<{
  weekSaleCount: number;
  weekRevenue: number;
  weekUpi: number;
  weekCash: number;
  daily: ReportDayBucket[];
}> {
  await connectDB();
  await ensureSeedProducts();

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekSales = await Sale.find({
    timestamp: { $gte: weekStart },
  }).lean();

  const daily: ReportDayBucket[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    daily.push({
      key: localDateKey(d),
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      revenue: 0,
      orders: 0,
      upi: 0,
      cash: 0,
    });
  }

  const keyToIndex = new Map(daily.map((x, i) => [x.key, i]));

  let weekRevenue = 0;
  let weekUpi = 0;
  let weekCash = 0;

  for (const s of weekSales) {
    weekRevenue += s.totalAmount;
    if (s.paymentMethod === "UPI") weekUpi += s.totalAmount;
    else weekCash += s.totalAmount;

    const k = localDateKey(new Date(s.timestamp));
    const idx = keyToIndex.get(k);
    if (idx !== undefined) {
      const row = daily[idx];
      row.revenue += s.totalAmount;
      row.orders += 1;
      if (s.paymentMethod === "UPI") row.upi += s.totalAmount;
      else row.cash += s.totalAmount;
    }
  }

  return {
    weekSaleCount: weekSales.length,
    weekRevenue,
    weekUpi,
    weekCash,
    daily,
  };
}
