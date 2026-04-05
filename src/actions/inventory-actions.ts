"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/mongodb";
import {
  isPopsiclesMain,
  MAIN_CATEGORIES,
  type MainCategory,
  NONE_SUBCATEGORY,
  POPSICLE_SUB_CATEGORIES,
  type PopsicleSubCategory,
} from "@/lib/menu-categories";
import { backfillLegacySaleOrderIds } from "@/lib/backfill-sale-orderids";
import { migrateProductMenuFields } from "@/lib/migrate-menu-products";
import { Product } from "@/models/Product";

function requireManager() {
  return getSession().then((s) =>
    s?.role === "manager" ? s : null,
  );
}

export async function runMenuMigrationAction(): Promise<
  | { ok: true; updated: number; legacySalesTagged: number }
  | { ok: false; error: string }
> {
  const session = await requireManager();
  if (!session) {
    return { ok: false, error: "Only managers can run migration." };
  }
  try {
    const updated = await migrateProductMenuFields();
    const legacySalesTagged = await backfillLegacySaleOrderIds();
    revalidatePath("/inventory");
    revalidatePath("/pos");
    revalidatePath("/dashboard");
    return { ok: true, updated, legacySalesTagged };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Migration failed.",
    };
  }
}

export type CreateProductInput = {
  name: string;
  mainCategory: MainCategory;
  subCategory: string;
  price: number;
  stockCount: number;
  lowStockThreshold: number;
  thumbnailUrl?: string;
};

export async function createProductAction(
  input: CreateProductInput,
): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const session = await requireManager();
  if (!session) {
    return { ok: false, error: "Only managers can add products." };
  }

  const name = input.name?.trim() ?? "";
  if (!name) return { ok: false, error: "Name is required." };

  if (!MAIN_CATEGORIES.includes(input.mainCategory)) {
    return { ok: false, error: "Invalid main category." };
  }

  const main = input.mainCategory;
  let sub = input.subCategory?.trim() || NONE_SUBCATEGORY;

  if (isPopsiclesMain(main)) {
    if (
      !POPSICLE_SUB_CATEGORIES.includes(sub as PopsicleSubCategory)
    ) {
      return { ok: false, error: "Pick a valid popsicle sub-category." };
    }
  } else {
    sub = NONE_SUBCATEGORY;
  }

  const price = Number(input.price);
  const stockCount = Math.floor(Number(input.stockCount));
  const lowStockThreshold = Math.floor(Number(input.lowStockThreshold));

  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "Invalid price." };
  }
  if (!Number.isFinite(stockCount) || stockCount < 0) {
    return { ok: false, error: "Invalid stock count." };
  }
  if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) {
    return { ok: false, error: "Invalid low-stock threshold." };
  }

  const thumbnailUrl = input.thumbnailUrl?.trim() || undefined;

  try {
    await connectDB();
    const doc = await Product.create({
      name,
      mainCategory: main,
      subCategory: sub,
      price,
      stockCount,
      lowStockThreshold,
      thumbnailUrl,
    });
    revalidatePath("/inventory");
    revalidatePath("/pos");
    revalidatePath("/dashboard");
    return { ok: true, id: doc._id.toString() };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not create product.",
    };
  }
}
