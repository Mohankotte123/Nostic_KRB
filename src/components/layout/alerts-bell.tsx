"use client";

import type { ProductDTO } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Package } from "lucide-react";

type Props = {
  lowStockProducts: ProductDTO[];
};

export function AlertsBell({ lowStockProducts }: Props) {
  const count = lowStockProducts.length;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="relative size-10 shrink-0 border-white/10 bg-[#161B22]/80 text-zinc-100 shadow-md backdrop-blur-md"
          />
        }
      >
        <>
          <Bell className="size-[18px]" />
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(245,158,11,0.65)]">
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
          <span className="sr-only">Stock alerts</span>
        </>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <PopoverHeader className="border-b border-white/10 px-4 py-3">
          <PopoverTitle className="text-sm font-semibold text-white">
            Low stock
          </PopoverTitle>
          <p className="text-xs text-zinc-500">Below reorder threshold</p>
        </PopoverHeader>
        <ul className="max-h-64 overflow-y-auto p-2">
          {count === 0 ? (
            <li className="px-2 py-6 text-center text-sm text-zinc-500">
              All products are above threshold.
            </li>
          ) : (
            lowStockProducts.map((p) => (
              <li
                key={p._id}
                className="flex items-center gap-3 rounded-[12px] px-2 py-2 text-sm"
              >
                <div className="flex size-9 items-center justify-center rounded-[12px] bg-amber-500/15 ring-1 ring-amber-500/25">
                  <Package className="size-4 text-amber-400/90" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-zinc-100">{p.name}</p>
                  <p className="text-xs text-zinc-500 tabular-nums">
                    {p.stockCount} left · threshold {p.lowStockThreshold}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
