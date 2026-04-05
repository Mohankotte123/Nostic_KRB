"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { loadDashboardData } from "@/lib/dashboard-data";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";
import type { Types } from "mongoose";

function generateOrderId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const part = randomBytes(3).toString("hex").toUpperCase();
  return `NOST-${y}${mo}${da}-${part}`;
}

function isMongoDuplicateKey(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: number }).code === 11000
  );
}

export async function refreshDashboardData() {
  return loadDashboardData();
}

export type PaymentMethod = "UPI" | "Cash";

export async function restockProduct(
  productId: string,
  amount: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await connectDB();
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: "Enter a positive number of units." };
    }
    const updated = await Product.findByIdAndUpdate(
      productId,
      { $inc: { stockCount: Math.floor(amount) } },
      { new: true },
    );
    if (!updated) return { ok: false, error: "Product not found." };
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Restock failed.",
    };
  }
}

export async function completeSale(
  lines: { productId: string; qty: number }[],
  paymentMethod: PaymentMethod,
): Promise<
  | {
      ok: true;
      orderId: string;
      totalAmount: number;
      soldAtIso: string;
      receiptLines: {
        name: string;
        qty: number;
        unitPrice: number;
        lineTotal: number;
      }[];
    }
  | { ok: false; error: string }
> {
  try {
    await connectDB();
    if (!lines.length) {
      return { ok: false, error: "Cart is empty." };
    }

    const normalized = lines.map((l) => ({
      productId: l.productId,
      qty: Math.floor(l.qty),
    }));
    if (normalized.some((l) => l.qty < 1)) {
      return { ok: false, error: "Invalid quantities." };
    }

    const previews = await Promise.all(
      normalized.map(async (l) => {
        const p = await Product.findById(l.productId).lean();
        return { line: l, product: p };
      }),
    );

    let totalAmount = 0;
    const receiptLines: {
      name: string;
      qty: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];

    for (const { line, product } of previews) {
      if (!product) return { ok: false, error: "A product was not found." };
      if (product.stockCount < line.qty) {
        return {
          ok: false,
          error: `Not enough stock for ${product.name}.`,
        };
      }
      const lineTotal = product.price * line.qty;
      totalAmount += lineTotal;
      receiptLines.push({
        name: product.name,
        qty: line.qty,
        unitPrice: product.price,
        lineTotal,
      });
    }

    const applied: { id: Types.ObjectId; qty: number }[] = [];

    try {
      for (const { line } of previews) {
        const updated = await Product.findOneAndUpdate(
          { _id: line.productId, stockCount: { $gte: line.qty } },
          { $inc: { stockCount: -line.qty } },
          { new: true },
        );
        if (!updated) {
          throw new Error("STOCK_CONFLICT");
        }
        applied.push({ id: updated._id, qty: line.qty });
      }

      let orderIdResult: string | null = null;
      let soldAtIsoResult: string | null = null;
      for (let attempt = 0; attempt < 12; attempt++) {
        const orderId = generateOrderId();
        try {
          const sale = await Sale.create({
            orderId,
            items: normalized.map((l) => ({
              product: l.productId,
              qty: l.qty,
            })),
            totalAmount,
            paymentMethod,
          });
          orderIdResult = orderId;
          soldAtIsoResult = sale.timestamp.toISOString();
          break;
        } catch (e) {
          if (isMongoDuplicateKey(e) && attempt < 11) continue;
          throw e;
        }
      }
      if (!orderIdResult || !soldAtIsoResult) {
        throw new Error("Could not assign order ID.");
      }

      revalidatePath("/");
      return {
        ok: true,
        orderId: orderIdResult,
        totalAmount,
        soldAtIso: soldAtIsoResult,
        receiptLines,
      };
    } catch {
      for (const a of applied.reverse()) {
        await Product.updateOne({ _id: a.id }, { $inc: { stockCount: a.qty } });
      }
      return {
        ok: false,
        error: "Could not complete sale (stock changed). Try again.",
      };
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Sale failed.",
    };
  }
}
