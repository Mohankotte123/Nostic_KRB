import { connectDB } from "@/lib/mongodb";
import { Sale } from "@/models/Sale";
import { randomBytes } from "crypto";

/**
 * Assigns orderId to sales created before order IDs existed (sparse index safe).
 */
export async function backfillLegacySaleOrderIds(): Promise<number> {
  await connectDB();
  const coll = Sale.collection;
  let updated = 0;

  const cursor = coll.find({
    $or: [
      { orderId: { $exists: false } },
      { orderId: null },
      { orderId: "" },
    ],
  });

  for await (const doc of cursor) {
    const suffix = randomBytes(3).toString("hex").toUpperCase();
    const orderId = `LEGACY-${doc._id.toString().slice(-8)}-${suffix}`;
    await coll.updateOne({ _id: doc._id }, { $set: { orderId } });
    updated += 1;
  }

  return updated;
}
