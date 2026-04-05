"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  completeSale,
  refreshDashboardData,
  type PaymentMethod,
} from "@/actions/pos-actions";
import type {
  FastestFlavor,
  ProductDTO,
  TodaySummary,
} from "@/lib/dashboard-data";
import {
  categoryLabel,
  MAIN_CATEGORIES,
  type MainCategory,
  POPSICLE_SUB_CATEGORIES,
  type PopsicleSubCategory,
} from "@/lib/menu-categories";
import {
  buildInvoicePdfBlob,
  downloadInvoicePdf,
  printInvoicePdf,
} from "@/lib/invoice-pdf";
import type { FranchiseDetails } from "@/types/franchise";
import type { InvoicePayload } from "@/types/invoice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Download,
  IndianRupee,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingCart,
} from "lucide-react";

type CartLine = { productId: string; qty: number };

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

type CompletedOrder = {
  orderId: string;
  soldAtIso: string;
  paymentMethod: PaymentMethod;
  lines: {
    name: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  totalAmount: number;
};

function toInvoicePayload(
  franchise: FranchiseDetails,
  order: CompletedOrder,
  isDraft?: boolean,
): InvoicePayload {
  return {
    franchise,
    orderId: order.orderId,
    soldAtIso: order.soldAtIso,
    paymentMethod: order.paymentMethod,
    lines: order.lines,
    totalAmount: order.totalAmount,
    isDraft,
  };
}

type Props = {
  franchise: FranchiseDetails;
  initialProducts: ProductDTO[];
  initialLowStock: ProductDTO[];
  initialTodaySummary: TodaySummary;
  initialFastestFlavor: FastestFlavor;
};

export function PosTerminal({
  franchise,
  initialProducts,
  initialLowStock,
  initialTodaySummary,
  initialFastestFlavor,
}: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [, setLowStockProducts] = useState(initialLowStock);
  const [, setTodaySummary] = useState(initialTodaySummary);
  const [, setFastestFlavor] = useState(initialFastestFlavor);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [banner, setBanner] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null,
  );
  const [pdfPreview, setPdfPreview] = useState<{
    url: string;
    payload: InvoicePayload;
  } | null>(null);

  function closePdfPreview() {
    setPdfPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }

  function openPdfPreview(payload: InvoicePayload) {
    const url = URL.createObjectURL(buildInvoicePdfBlob(payload));
    setPdfPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { url, payload };
    });
  }

  const [menuMain, setMenuMain] = useState<MainCategory>(MAIN_CATEGORIES[0]);
  const [popsicleFilter, setPopsicleFilter] = useState<
    PopsicleSubCategory | "All"
  >("All");
  const [menuSearch, setMenuSearch] = useState("");

  const cartLines: CartLine[] = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([productId, qty]) => ({ productId, qty })),
    [cart],
  );

  const productById = useMemo(() => {
    const m = new Map<string, ProductDTO>();
    for (const p of products) m.set(p._id, p);
    return m;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();

    const inMenuSlice = (p: ProductDTO) => {
      if (p.mainCategory !== menuMain) return false;
      if (menuMain === "Popsicles") {
        if (popsicleFilter === "All") return true;
        return p.subCategory === popsicleFilter;
      }
      return true;
    };

    const matchesQuery = (p: ProductDTO) => {
      if (!q) return true;
      const label = categoryLabel(p.mainCategory, p.subCategory).toLowerCase();
      const priceStr = String(p.price);
      return (
        p.name.toLowerCase().includes(q) ||
        label.includes(q) ||
        p.mainCategory.toLowerCase().includes(q) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
        priceStr.includes(q)
      );
    };

    return products.filter((p) => inMenuSlice(p) && matchesQuery(p));
  }, [products, menuMain, popsicleFilter, menuSearch]);

  const cartTotal = useMemo(() => {
    let t = 0;
    for (const line of cartLines) {
      const p = productById.get(line.productId);
      if (p) t += p.price * line.qty;
    }
    return t;
  }, [cartLines, productById]);

  const hasItems = cartLines.length > 0;

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

  function addToCart(productId: string) {
    setBanner(null);
    setCart((c) => {
      const p = productById.get(productId);
      if (!p) return c;
      const nextQty = (c[productId] ?? 0) + 1;
      if (nextQty > p.stockCount) return c;
      return { ...c, [productId]: nextQty };
    });
  }

  function decFromCart(productId: string) {
    setCart((c) => {
      const q = (c[productId] ?? 0) - 1;
      if (q <= 0) {
        const next = { ...c };
        delete next[productId];
        return next;
      }
      return { ...c, [productId]: q };
    });
  }

  function clearCart() {
    setCart({});
  }

  async function handleCompleteSale() {
    setBanner(null);
    setCheckoutPending(true);
    try {
      const res = await completeSale(cartLines, paymentMethod);
      if (!res.ok) {
        setBanner(res.error);
        return;
      }
      setCompletedOrder({
        orderId: res.orderId,
        soldAtIso: res.soldAtIso,
        paymentMethod,
        lines: res.receiptLines,
        totalAmount: res.totalAmount,
      });
      clearCart();
      const fresh = await refreshDashboardData();
      applyDashboardSnapshot(fresh);
    } finally {
      setCheckoutPending(false);
    }
  }

  const cartPanelInner = (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold text-white">Order</h2>
        {hasItems ? (
          <Badge variant="secondary" className="rounded-[16px] border-white/10 bg-indigo-500/15 text-indigo-200">
            {cartLines.length} lines
          </Badge>
        ) : null}
      </div>

      <ScrollArea className="min-h-[160px] flex-1 rounded-[16px] border border-white/10 bg-white/[0.04] shadow-inner backdrop-blur-sm">
        <div className="space-y-1 p-3">
          {!hasItems ? (
            <p className="px-1 py-8 text-center text-sm leading-relaxed text-zinc-500">
              Tap products to add them to this order. Totals and checkout appear
              here once the cart has items.
            </p>
          ) : (
            cartLines.map((line) => {
              const p = productById.get(line.productId);
              if (!p) return null;
              return (
                <div
                  key={line.productId}
                  className="flex items-start justify-between gap-2 rounded-[16px] border border-white/10 bg-[#161B22]/90 p-2.5 text-sm shadow-md backdrop-blur-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-zinc-100">{p.name}</p>
                    <p className="text-xs text-zinc-500 tabular-nums">
                      <span className="font-semibold text-emerald-400/90">
                        {formatMoney(p.price)}
                      </span>{" "}
                      × {line.qty}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="rounded-[16px]"
                      aria-label="Decrease"
                      onClick={() => decFromCart(line.productId)}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-6 text-center font-bold tabular-nums text-zinc-200">
                      {line.qty}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="rounded-[16px]"
                      aria-label="Increase"
                      onClick={() => addToCart(line.productId)}
                      disabled={line.qty >= p.stockCount}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {hasItems ? (
        <>
          <Separator className="bg-white/10" />
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Payment
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-11 rounded-[16px] text-base font-semibold",
                  paymentMethod === "UPI" &&
                    "border-indigo-400/40 bg-[#6366F1]/25 text-white shadow-[0_0_20px_-6px_rgba(99,102,241,0.45)] hover:bg-[#6366F1]/35",
                )}
                onClick={() => setPaymentMethod("UPI")}
              >
                UPI
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-11 rounded-[16px] text-base font-semibold",
                  paymentMethod === "Cash" &&
                    "border-indigo-400/40 bg-[#6366F1]/25 text-white shadow-[0_0_20px_-6px_rgba(99,102,241,0.45)] hover:bg-[#6366F1]/35",
                )}
                onClick={() => setPaymentMethod("Cash")}
              >
                Cash
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-lg">
            <span className="font-semibold text-zinc-300">Total</span>
            <span className="flex items-center gap-1 text-xl font-extrabold tracking-tight text-emerald-400 tabular-nums">
              <IndianRupee className="size-5 text-emerald-500/80" />
              {formatMoney(cartTotal)}
            </span>
          </div>
          <Button
            type="button"
            size="lg"
            disabled={checkoutPending}
            onClick={() => void handleCompleteSale()}
            className="h-12 w-full rounded-[16px] text-base font-bold shadow-[0_0_28px_-6px_rgba(16,185,129,0.55)]"
          >
            {checkoutPending ? "Processing…" : "Complete sale"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-[16px]"
            onClick={() => {
              setBanner(null);
              if (!cartLines.length) {
                setBanner("Add items to the cart to preview an invoice.");
                return;
              }
              const payload: InvoicePayload = {
                franchise,
                orderId: `DRAFT-${Date.now()}`,
                soldAtIso: new Date().toISOString(),
                paymentMethod,
                lines: cartLines.map((l) => {
                  const pr = productById.get(l.productId)!;
                  return {
                    name: pr.name,
                    qty: l.qty,
                    unitPrice: pr.price,
                    lineTotal: pr.price * l.qty,
                  };
                }),
                totalAmount: cartTotal,
                isDraft: true,
              };
              openPdfPreview(payload);
            }}
          >
            <Printer className="mr-2 size-4" />
            Preview draft invoice (PDF)
          </Button>
        </>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
          POS Terminal
        </h1>
        <p className="text-sm text-zinc-500">
          Add items to the cart, then choose payment and complete the sale.
        </p>
      </div>

      {banner ? (
        <div
          className="rounded-[16px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-sm"
          role="alert"
        >
          {banner}
        </div>
      ) : null}

      <Dialog
        open={completedOrder !== null}
        onOpenChange={(open) => {
          if (!open) setCompletedOrder(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#161B22]/95 text-zinc-100 backdrop-blur-[10px] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Order placed</DialogTitle>
            <p className="text-left text-sm text-zinc-400">
              Sale recorded. Print or download the tax invoice / receipt when
              ready.
            </p>
          </DialogHeader>
          {completedOrder ? (
            <div className="space-y-4">
              <div className="rounded-[16px] border border-emerald-500/25 bg-emerald-500/10 p-4">
                <p className="text-xs font-semibold tracking-wide text-emerald-200/80 uppercase">
                  Order ID
                </p>
                <p className="font-mono text-xl font-bold tracking-tight text-emerald-300">
                  {completedOrder.orderId}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {new Date(completedOrder.soldAtIso).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  · {completedOrder.paymentMethod}
                </p>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-[12px] border border-white/10 bg-black/20 p-3 text-sm">
                {completedOrder.lines.map((l, i) => (
                  <div
                    key={`${completedOrder.orderId}-${i}`}
                    className="flex justify-between gap-2 border-b border-white/5 py-2 last:border-0"
                  >
                    <span className="font-medium text-zinc-200">{l.name}</span>
                    <span className="shrink-0 tabular-nums text-zinc-400">
                      ×{l.qty} {formatMoney(l.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-right text-lg font-extrabold text-emerald-400">
                Total {formatMoney(completedOrder.totalAmount)}
              </p>
            </div>
          ) : null}
          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-[16px]"
              onClick={() => setCompletedOrder(null)}
            >
              Done
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-[16px] border-indigo-400/30"
              onClick={() => {
                if (!completedOrder) return;
                downloadInvoicePdf(
                  toInvoicePayload(franchise, completedOrder, false),
                );
              }}
            >
              <Download className="mr-2 size-4" />
              Download PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-[16px] border-white/15"
              onClick={() => {
                if (!completedOrder) return;
                openPdfPreview(
                  toInvoicePayload(franchise, completedOrder, false),
                );
              }}
            >
              <Printer className="mr-2 size-4" />
              Preview PDF
            </Button>
            <Button
              type="button"
              className="rounded-[16px] font-bold"
              onClick={() => {
                if (!completedOrder) return;
                printInvoicePdf(
                  toInvoicePayload(franchise, completedOrder, false),
                );
              }}
            >
              <Printer className="mr-2 size-4" />
              Print invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pdfPreview !== null}
        onOpenChange={(open) => {
          if (!open) closePdfPreview();
        }}
      >
        <DialogContent className="flex h-[min(90vh,720px)] max-w-4xl flex-col gap-0 overflow-hidden border-white/10 bg-[#161B22]/95 p-0 text-zinc-100 backdrop-blur-[10px]">
          <DialogHeader className="shrink-0 border-b border-white/10 px-5 py-4">
            <DialogTitle className="text-white">Invoice preview</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Draft or completed sale as PDF. Use your browser print dialog to
              save as PDF if needed.
            </DialogDescription>
          </DialogHeader>
          {pdfPreview ? (
            <iframe
              key={pdfPreview.url}
              src={pdfPreview.url}
              title="Invoice PDF preview"
              className="min-h-0 w-full flex-1 border-0 bg-zinc-950"
            />
          ) : null}
          <DialogFooter className="shrink-0 flex-col gap-2 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-[16px]"
              onClick={closePdfPreview}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-[16px] border-indigo-400/30"
              onClick={() => {
                if (!pdfPreview) return;
                downloadInvoicePdf(pdfPreview.payload);
              }}
            >
              <Download className="mr-2 size-4" />
              Download PDF
            </Button>
            <Button
              type="button"
              className="rounded-[16px] font-bold"
              onClick={() => {
                if (!pdfPreview) return;
                printInvoicePdf(pdfPreview.payload);
              }}
            >
              <Printer className="mr-2 size-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center justify-between xl:pr-2">
            <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Menu
            </h2>
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm" className="rounded-[16px] xl:hidden" />
                }
              >
                <ShoppingCart className="mr-2 size-4" />
                Cart
                {hasItems ? (
                  <Badge
                    className="ml-2 rounded-[16px] border-white/10 bg-indigo-500/15 text-indigo-200"
                    variant="secondary"
                  >
                    {cartLines.length}
                  </Badge>
                ) : null}
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex w-full flex-col sm:max-w-md"
              >
                <SheetHeader>
                  <SheetTitle className="text-white">Cart</SheetTitle>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-6">
                  {cartPanelInner}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="space-y-1.5 xl:pr-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500"
                aria-hidden
              />
              <Input
                type="search"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Search in this category…"
                className="h-11 pl-10"
                autoComplete="off"
                enterKeyHint="search"
                aria-label="Search products"
              />
            </div>
            {menuSearch.trim() ? (
              <p className="text-[11px] text-zinc-500">
                Filtered by the selected tab
                {menuMain === "Popsicles" && popsicleFilter !== "All"
                  ? ` (${popsicleFilter})`
                  : ""}
                .
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {MAIN_CATEGORIES.map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setMenuMain(m);
                  setPopsicleFilter("All");
                }}
                className={cn(
                  "rounded-[16px] border-white/15 font-semibold",
                  menuMain === m &&
                    "border-emerald-500/40 bg-[#10B981]/20 text-white shadow-[0_0_20px_-8px_rgba(16,185,129,0.45)]",
                )}
              >
                {m}
              </Button>
            ))}
          </div>

          {menuMain === "Popsicles" ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
              <span className="w-full text-[11px] font-semibold tracking-wide text-zinc-500 uppercase sm:w-auto sm:pr-2">
                Popsicle type
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={cn(
                  "h-8 rounded-full px-3 text-xs font-medium",
                  popsicleFilter === "All"
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-200",
                )}
                onClick={() => setPopsicleFilter("All")}
              >
                All
              </Button>
              {POPSICLE_SUB_CATEGORIES.map((sub) => (
                <Button
                  key={sub}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-8 rounded-full px-3 text-xs font-medium",
                    popsicleFilter === sub
                      ? "bg-indigo-500/25 text-indigo-100 ring-1 ring-indigo-400/35"
                      : "text-zinc-500 hover:text-zinc-200",
                  )}
                  onClick={() => setPopsicleFilter(sub)}
                >
                  {sub}
                </Button>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-2 items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((p) => {
              const inCart = cart[p._id] ?? 0;
              const outOfStock = p.stockCount <= 0;
              return (
                <button
                  key={p._id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => addToCart(p._id)}
                  className={cn(
                    "group flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[16px] border border-white/10 bg-[#161B22]/75 text-left text-zinc-100 shadow-lg shadow-black/30 backdrop-blur-[10px] transition-all duration-200",
                    "hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-[0_16px_48px_-12px_rgba(99,102,241,0.35)]",
                    "focus-visible:ring-[3px] focus-visible:ring-[#10B981]/40 focus-visible:outline-none",
                    "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0",
                  )}
                >
                  <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-zinc-900/50">
                    <Image
                      src={p.thumbnailUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width:640px) 50vw, 200px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <Badge
                      className="absolute top-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-[12px] border border-white/10 bg-black/50 text-xs font-semibold text-white backdrop-blur-md"
                      variant="secondary"
                    >
                      {categoryLabel(p.mainCategory, p.subCategory)}
                    </Badge>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col p-3">
                    <div className="flex min-h-[2.75rem] shrink-0 items-start md:min-h-[3.25rem]">
                      <p className="line-clamp-2 w-full text-left text-base leading-snug font-bold md:text-lg md:font-extrabold">
                        {p.name}
                      </p>
                    </div>
                    <div className="mt-auto flex shrink-0 flex-col gap-2 border-t border-white/[0.06] pt-2.5">
                      <div className="flex min-h-[3.5rem] items-end justify-between gap-2 md:min-h-[3.75rem]">
                        <p className="text-lg font-extrabold tracking-tight text-emerald-400 tabular-nums md:text-xl">
                          {formatMoney(p.price)}
                        </p>
                        <div className="text-right text-xs leading-snug text-zinc-500 tabular-nums">
                          <span className="block">Stock {p.stockCount}</span>
                          <div className="mt-1 min-h-[1.125rem] text-xs font-bold text-indigo-300">
                            {inCart > 0 ? `In cart: ${inCart}` : null}
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Tap to add to cart
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              {menuSearch.trim()
                ? "No products match your search in this category."
                : "No products in this menu slice. Try another tab or sub-filter."}
            </p>
          ) : null}
        </div>

        <aside className="xl:w-[380px] xl:shrink-0">
          <Card className="sticky top-4 hidden overflow-hidden xl:flex xl:min-h-[320px] xl:flex-col">
            <CardContent className="flex flex-1 flex-col p-4 pt-5">
              {cartPanelInner}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
