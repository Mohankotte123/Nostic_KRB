"use client";

import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { ReportDayBucket } from "@/lib/reports-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const tipContent = {
  backgroundColor: "rgba(22, 27, 34, 0.96)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  backdropFilter: "blur(10px)",
} as const;

type Props = {
  daily: ReportDayBucket[];
  today: {
    saleCount: number;
    upiTotal: number;
    cashTotal: number;
  };
  week: {
    weekSaleCount: number;
    weekRevenue: number;
    weekUpi: number;
    weekCash: number;
  };
};

export function ReportsDashboard({ daily, today, week }: Props) {
  const mainGradId = useId().replace(/:/g, "");
  const chartData = useMemo(
    () => daily.map((d) => ({ ...d, name: d.label })),
    [daily],
  );

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardDescription className="text-indigo-300/90">
            Last 7 days
          </CardDescription>
          <CardTitle className="text-xl font-bold text-white">
            Total revenue
          </CardTitle>
          <p className="text-2xl font-extrabold tracking-tight text-emerald-400 tabular-nums">
            {formatMoney(week.weekRevenue)}
          </p>
        </CardHeader>
        <CardContent className="pb-5 pt-0">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id={mainGradId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.85} />
                    <stop
                      offset="55%"
                      stopColor="#6366F1"
                      stopOpacity={0.25}
                    />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tipContent}
                  labelStyle={{ color: "rgba(255,255,255,0.55)" }}
                  itemStyle={{ color: "#34D399", fontWeight: 700 }}
                  formatter={(value) => {
                    const v =
                      typeof value === "number"
                        ? value
                        : value != null
                          ? Number(value)
                          : NaN;
                    if (Number.isNaN(v)) return ["—", "Revenue"];
                    return [formatMoney(v), "Revenue"];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fill={`url(#${mainGradId})`}
                  dot={false}
                  activeDot={{ r: 4, fill: "#10B981", stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SparkCard
          title="Orders per day"
          subtitle="7-day activity"
          total={week.weekSaleCount}
          totalLabel="Total orders"
          dataKey="orders"
          chartData={chartData}
          stroke="#6366F1"
          money={false}
        />
        <SparkCard
          title="UPI volume"
          subtitle="Daily trend"
          total={week.weekUpi}
          totalLabel="Week UPI"
          dataKey="upi"
          chartData={chartData}
          stroke="#10B981"
          money
        />
        <SparkCard
          title="Cash volume"
          subtitle="Daily trend"
          total={week.weekCash}
          totalLabel="Week cash"
          dataKey="cash"
          chartData={chartData}
          stroke="#F59E0B"
          money
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TodayMini
          label="Today — orders"
          value={String(today.saleCount)}
          accent="indigo"
        />
        <TodayMini
          label="Today — UPI"
          value={formatMoney(today.upiTotal)}
          accent="emerald"
        />
        <TodayMini
          label="Today — Cash"
          value={formatMoney(today.cashTotal)}
          accent="amber"
        />
      </div>
    </div>
  );
}

function SparkCard({
  title,
  subtitle,
  total,
  totalLabel,
  dataKey,
  chartData,
  stroke,
  money,
}: {
  title: string;
  subtitle: string;
  total: number;
  totalLabel: string;
  dataKey: "orders" | "upi" | "cash" | "revenue";
  chartData: (ReportDayBucket & { name: string })[];
  stroke: string;
  money: boolean;
}) {
  const gradId = useId().replace(/:/g, "");
  const label =
    dataKey === "orders"
      ? "Orders"
      : dataKey === "upi"
        ? "UPI"
        : dataKey === "cash"
          ? "Cash"
          : "Revenue";

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardDescription className="text-white/50">{subtitle}</CardDescription>
        <CardTitle className="text-base font-bold text-white">{title}</CardTitle>
        <p
          className={`pt-1 text-lg font-extrabold tracking-tight tabular-nums ${
            money ? "text-emerald-400" : "text-indigo-300"
          }`}
        >
          {money ? formatMoney(total) : total}
        </p>
        <p className="text-white/35 text-[11px]">{totalLabel}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[80px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={tipContent}
                labelStyle={{ color: "rgba(255,255,255,0.55)" }}
                itemStyle={{ color: "#F9FAFB", fontWeight: 600 }}
                formatter={(value) => {
                  const v =
                    typeof value === "number"
                      ? value
                      : value != null
                        ? Number(value)
                        : NaN;
                  if (Number.isNaN(v)) return ["—", label];
                  return money ? [formatMoney(v), label] : [v, label];
                }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={stroke}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function TodayMini({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "indigo" | "emerald" | "amber";
}) {
  const ring =
    accent === "indigo"
      ? "shadow-[0_0_28px_-8px_rgba(99,102,241,0.5)]"
      : accent === "emerald"
        ? "shadow-[0_0_28px_-8px_rgba(16,185,129,0.45)]"
        : "shadow-[0_0_28px_-8px_rgba(245,158,11,0.4)]";
  return (
    <Card className={ring}>
      <CardHeader className="pb-2">
        <CardDescription className="text-white/50">{label}</CardDescription>
        <CardTitle className="text-xl font-extrabold tracking-tight tabular-nums text-white">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
