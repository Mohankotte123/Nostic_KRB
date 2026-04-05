"use client";

import { useMemo, useState } from "react";
import {
  createProductAction,
  runMenuMigrationAction,
} from "@/actions/inventory-actions";
import { refreshDashboardData, restockProduct } from "@/actions/pos-actions";
import type {
  FastestFlavor,
  ProductDTO,
  TodaySummary,
} from "@/lib/dashboard-data";
import {
  categoryLabel,
  defaultSubCategoryForMain,
  isPopsiclesMain,
  MAIN_CATEGORIES,
  type MainCategory,
  NONE_SUBCATEGORY,
  POPSICLE_SUB_CATEGORIES,
} from "@/lib/menu-categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const selectClass =
  "flex h-11 w-full rounded-[16px] border border-white/15 bg-white/[0.06] px-3 text-sm text-zinc-100 outline-none focus-visible:ring-[3px] focus-visible:ring-[#10B981]/35";

type Props = {
  initialProducts: ProductDTO[];
  initialLowStock: ProductDTO[];
  initialTodaySummary: TodaySummary;
  initialFastestFlavor: FastestFlavor;
};

export function InventoryManager({
  initialProducts,
  initialLowStock,
  initialTodaySummary,
  initialFastestFlavor,
}: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [, setLowStockProducts] = useState(initialLowStock);
  const [, setTodaySummary] = useState(initialTodaySummary);
  const [, setFastestFlavor] = useState(initialFastestFlavor);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);

  const [restockOpen, setRestockOpen] = useState(false);
  const [restockProductId, setRestockProductId] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState("12");

  const [addOpen, setAddOpen] = useState(false);
  const [addPending, setAddPending] = useState(false);
  const [migratePending, setMigratePending] = useState(false);
  const [formName, setFormName] = useState("");
  const [formMain, setFormMain] = useState<MainCategory>(MAIN_CATEGORIES[0]);
  const [formSub, setFormSub] = useState<string>(
    defaultSubCategoryForMain(MAIN_CATEGORIES[0]),
  );
  const [formPrice, setFormPrice] = useState("60");
  const [formStock, setFormStock] = useState("20");
  const [formThreshold, setFormThreshold] = useState("8");
  const [formThumb, setFormThumb] = useState("");

  const filtered = useMemo(() => {
    if (!lowStockOnly) return products;
    return products.filter((p) => p.stockCount < p.lowStockThreshold);
  }, [products, lowStockOnly]);

  const productById = useMemo(() => {
    const m = new Map<string, ProductDTO>();
    for (const p of products) m.set(p._id, p);
    return m;
  }, [products]);

  function applyDashboardSnapshot(next: {
    products: ProductDTO[];
    lowStockProducts: ProductDTO[];
    todaySummary: TodaySummary;
    fastestFlavor: FastestFlavor;
  }) {
    setProducts(next.products);
    setLowStockProducts(next.lowStockProducts);
    setTodaySummary(next.todaySummary);
    setFastestFlavor(next.fastestFlavor);
  }

  function openRestock(id: string) {
    setRestockProductId(id);
    setRestockAmount("12");
    setRestockOpen(true);
    setBanner(null);
  }

  function openAddProduct() {
    setFormName("");
    setFormMain(MAIN_CATEGORIES[0]);
    setFormSub(defaultSubCategoryForMain(MAIN_CATEGORIES[0]));
    setFormPrice("60");
    setFormStock("20");
    setFormThreshold("8");
    setFormThumb("");
    setBanner(null);
    setAddOpen(true);
  }

  function onFormMainChange(main: MainCategory) {
    setFormMain(main);
    setFormSub(defaultSubCategoryForMain(main));
  }

  async function submitRestock() {
    if (!restockProductId) return;
    const amt = Number(restockAmount);
    const res = await restockProduct(restockProductId, amt);
    if (!res.ok) {
      setBanner(res.error);
      return;
    }
    setRestockOpen(false);
    const fresh = await refreshDashboardData();
    applyDashboardSnapshot(fresh);
  }

  async function submitAddProduct() {
    setAddPending(true);
    setBanner(null);
    try {
      const res = await createProductAction({
        name: formName,
        mainCategory: formMain,
        subCategory: isPopsiclesMain(formMain) ? formSub : NONE_SUBCATEGORY,
        price: Number(formPrice),
        stockCount: Number(formStock),
        lowStockThreshold: Number(formThreshold),
        thumbnailUrl: formThumb.trim() || undefined,
      });
      if (!res.ok) {
        setBanner(res.error);
        return;
      }
      setAddOpen(false);
      const fresh = await refreshDashboardData();
      applyDashboardSnapshot(fresh);
      setInfoBanner("Product created.");
    } finally {
      setAddPending(false);
    }
  }

  async function runMigration() {
    setMigratePending(true);
    setBanner(null);
    setInfoBanner(null);
    try {
      const res = await runMenuMigrationAction();
      if (!res.ok) {
        setBanner(res.error);
        return;
      }
      const fresh = await refreshDashboardData();
      applyDashboardSnapshot(fresh);
      const parts: string[] = [];
      if (res.updated > 0) {
        parts.push(
          `Migrated ${res.updated} product(s) to the new menu fields.`,
        );
      }
      if (res.legacySalesTagged > 0) {
        parts.push(
          `Assigned order IDs to ${res.legacySalesTagged} legacy sale record(s).`,
        );
      }
      setInfoBanner(
        parts.length > 0
          ? parts.join(" ")
          : "No product or sale records needed migration.",
      );
    } finally {
      setMigratePending(false);
    }
  }

  const restockTarget = restockProductId
    ? productById.get(restockProductId)
    : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
            Inventory
          </h1>
          <p className="text-sm text-zinc-500">
            Stock levels, new products, and legacy category migration.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-[16px] font-semibold"
            disabled={migratePending}
            onClick={() => void runMigration()}
          >
            {migratePending ? "Migrating…" : "Migrate legacy categories"}
          </Button>
          <Button
            type="button"
            className="rounded-[16px] font-bold shadow-[0_0_20px_-6px_rgba(16,185,129,0.45)]"
            onClick={openAddProduct}
          >
            Add product
          </Button>
        </div>
      </div>

      {banner ? (
        <div
          className="rounded-[16px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-sm"
          role="alert"
        >
          {banner}
        </div>
      ) : null}

      {infoBanner ? (
        <div
          className="rounded-[16px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 backdrop-blur-sm"
          role="status"
        >
          {infoBanner}
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Stock table</CardTitle>
            <CardDescription>
              Filter to low-stock SKUs or restock any line item.
            </CardDescription>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-300">
            <Checkbox
              checked={lowStockOnly}
              onCheckedChange={(checked) => setLowStockOnly(checked === true)}
            />
            Low stock only
          </label>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-6 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-zinc-400">Product</TableHead>
                <TableHead className="text-zinc-400">Menu</TableHead>
                <TableHead className="text-right text-zinc-400">Price</TableHead>
                <TableHead className="text-right text-zinc-400">Stock</TableHead>
                <TableHead className="text-right text-zinc-400">
                  Threshold
                </TableHead>
                <TableHead className="text-right text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-zinc-500"
                  >
                    No products match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const low = p.stockCount < p.lowStockThreshold;
                  return (
                    <TableRow
                      key={p._id}
                      className={cn(
                        low &&
                          "border-amber-400/15 bg-amber-500/[0.06] shadow-[inset_0_0_48px_rgba(245,158,11,0.14)] ring-1 ring-amber-400/25 ring-inset hover:bg-amber-500/[0.09]",
                      )}
                    >
                      <TableCell className="font-bold text-zinc-100">
                        {p.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="rounded-[12px] border-white/15 text-zinc-300"
                        >
                          {categoryLabel(p.mainCategory, p.subCategory)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-base font-extrabold tracking-tight text-emerald-400 tabular-nums">
                        {formatMoney(p.price)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span
                          className={cn(
                            "font-bold",
                            low
                              ? "text-amber-300 shadow-none drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]"
                              : "text-zinc-200",
                          )}
                        >
                          {p.stockCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-zinc-500 tabular-nums">
                        {p.lowStockThreshold}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="rounded-[16px] font-semibold"
                          onClick={() => openRestock(p._id)}
                        >
                          Manual restock
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manual restock</DialogTitle>
          </DialogHeader>
          {restockTarget ? (
            <p className="text-sm text-zinc-400">
              Add units for{" "}
              <span className="font-bold text-zinc-100">
                {restockTarget.name}
              </span>
              . Current stock:{" "}
              <span className="tabular-nums font-semibold text-emerald-400">
                {restockTarget.stockCount}
              </span>
              .
            </p>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="restock-qty" className="text-zinc-300">
              Units to add
            </Label>
            <Input
              id="restock-qty"
              inputMode="numeric"
              value={restockAmount}
              onChange={(e) => setRestockAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRestockOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void submitRestock()}>
              Add stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="np-name" className="text-zinc-300">
                Name
              </Label>
              <Input
                id="np-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Mango Bar"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="np-main" className="text-zinc-300">
                Main category
              </Label>
              <select
                id="np-main"
                className={selectClass}
                value={formMain}
                onChange={(e) =>
                  onFormMainChange(e.target.value as MainCategory)
                }
              >
                {MAIN_CATEGORIES.map((m) => (
                  <option key={m} value={m} className="bg-zinc-900">
                    {m}
                  </option>
                ))}
              </select>
            </div>
            {isPopsiclesMain(formMain) ? (
              <div className="grid gap-2">
                <Label htmlFor="np-sub" className="text-zinc-300">
                  Popsicle type
                </Label>
                <select
                  id="np-sub"
                  className={selectClass}
                  value={formSub}
                  onChange={(e) => setFormSub(e.target.value)}
                >
                  {POPSICLE_SUB_CATEGORIES.map((s) => (
                    <option key={s} value={s} className="bg-zinc-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-2">
                <Label htmlFor="np-price" className="text-zinc-300">
                  Price (₹)
                </Label>
                <Input
                  id="np-price"
                  inputMode="decimal"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="np-stock" className="text-zinc-300">
                  Stock
                </Label>
                <Input
                  id="np-stock"
                  inputMode="numeric"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="np-thresh" className="text-zinc-300">
                Low-stock threshold
              </Label>
              <Input
                id="np-thresh"
                inputMode="numeric"
                value={formThreshold}
                onChange={(e) => setFormThreshold(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="np-thumb" className="text-zinc-300">
                Thumbnail URL (optional)
              </Label>
              <Input
                id="np-thumb"
                value={formThumb}
                onChange={(e) => setFormThumb(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={addPending}
              onClick={() => void submitAddProduct()}
            >
              {addPending ? "Saving…" : "Create product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
