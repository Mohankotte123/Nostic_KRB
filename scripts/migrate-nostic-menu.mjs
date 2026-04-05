/**
 * Temporary one-off: map legacy `category` (Scoop/Kulfi/Pack) → mainCategory + subCategory.
 * Run: node --env-file=.env.local scripts/migrate-nostic-menu.mjs
 * (Node 20+). Or: set MONGODB_URI in the environment, then node scripts/migrate-nostic-menu.mjs
 *
 * Prefer the in-app button: Inventory → "Migrate legacy categories" (manager).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import mongoose from "mongoose";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function legacyCategoryToMenu(category) {
  switch (String(category)) {
    case "Scoop":
      return { mainCategory: "Popsicles", subCategory: "Classic" };
    case "Kulfi":
      return { mainCategory: "Sipups", subCategory: "None" };
    case "Pack":
      return { mainCategory: "Packs", subCategory: "None" };
    default:
      return { mainCategory: "Merchandise", subCategory: "None" };
  }
}

function withAtlasDefaults(uri) {
  let s = uri.trim();
  if (!s.startsWith("mongodb+srv://")) return s;
  if (/[?&]retryWrites=/.test(s)) return s;
  const sep = s.includes("?") ? "&" : "?";
  return `${s}${sep}retryWrites=true&w=majority`;
}

loadEnvLocal();
const rawUri =
  process.env.MONGODB_URI?.trim() ||
  process.env.NEXT_PUBLIC_MONGODB_URI?.trim();
if (!rawUri) {
  console.error("Set MONGODB_URI or NEXT_PUBLIC_MONGODB_URI.");
  process.exit(1);
}
const uri = withAtlasDefaults(rawUri);

await mongoose.connect(uri);
const coll = mongoose.connection.collection("products");
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

  if (hasMain && hasSub && !hasCategory) continue;

  if (hasMain && hasSub && hasCategory) {
    await coll.updateOne({ _id: raw._id }, { $unset: { category: "" } });
    updated += 1;
    continue;
  }

  let mainCategory;
  let subCategory;
  if (hasCategory) {
    const m = legacyCategoryToMenu(raw.category);
    mainCategory = m.mainCategory;
    subCategory = m.subCategory;
  } else {
    mainCategory = "Merchandise";
    subCategory = "None";
  }

  await coll.updateOne(
    { _id: raw._id },
    { $set: { mainCategory, subCategory }, $unset: { category: "" } },
  );
  updated += 1;
}

console.log(`Done. Updated ${updated} document(s).`);
await mongoose.disconnect();
process.exit(0);
