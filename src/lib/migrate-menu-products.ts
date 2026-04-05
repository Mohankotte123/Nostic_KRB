import { connectDB } from "@/lib/mongodb";
import type { MainCategory, ProductSubCategory } from "@/lib/menu-categories";
import { legacyCategoryToMenu } from "@/lib/menu-categories";
import { Product } from "@/models/Product";

/**
 * One-time / idempotent migration: legacy `category` (Scoop/Kulfi/Pack) →
 * `mainCategory` + `subCategory`. Safe to run multiple times.
 */
export async function migrateProductMenuFields(): Promise<number> {
  await connectDB();
  const coll = Product.collection;
  let updated = 0;

  const cursor = coll.find({
    $or: [
      { category: { $exists: true } },
      { mainCategory: { $exists: false } },
      { subCategory: { $exists: false } },
    ],
  });

  for await (const raw of cursor) {
    const hasCategory = raw.category != null && raw.category !== "";
    const hasMain = raw.mainCategory != null && raw.mainCategory !== "";
    const hasSub = raw.subCategory != null && raw.subCategory !== "";

    if (hasMain && hasSub && !hasCategory) {
      continue;
    }

    if (hasMain && hasSub && hasCategory) {
      await coll.updateOne(
        { _id: raw._id },
        { $unset: { category: "" } },
      );
      updated += 1;
      continue;
    }

    let mainCategory: MainCategory;
    let subCategory: ProductSubCategory;

    if (hasCategory) {
      const mapped = legacyCategoryToMenu(String(raw.category));
      mainCategory = mapped.mainCategory;
      subCategory = mapped.subCategory;
    } else {
      mainCategory = "Merchandise";
      subCategory = "None";
    }

    await coll.updateOne(
      { _id: raw._id },
      {
        $set: { mainCategory, subCategory },
        $unset: { category: "" },
      },
    );
    updated += 1;
  }

  return updated;
}
