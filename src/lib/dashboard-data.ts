import "server-only";

import { connectDB } from "@/lib/mongodb";
import type { MainCategory } from "@/lib/menu-categories";
import { legacyCategoryToMenu, NONE_SUBCATEGORY } from "@/lib/menu-categories";
import { ensureSeedProducts } from "@/lib/seed-products";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";
import type { Types } from "mongoose";

export const MAIN_CATEGORY_THUMB_FALLBACK: Record<MainCategory, string> = {
  Popsicles:
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop&q=80",
  Sipups:
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop&q=80",
  Packs:
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop&q=80",
  Merchandise:
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop&q=80",
};

export type ProductDTO = {
  _id: string;
  name: string;
  mainCategory: MainCategory;
  subCategory: string;
  price: number;
  stockCount: number;
  lowStockThreshold: number;
  thumbnailUrl: string;
};

export type TodaySummary = {
  upiTotal: number;
  cashTotal: number;
  saleCount: number;
};

export type FastestFlavor = {
  productId: string;
  name: string;
  unitsSold: number;
} | null;

function startEndOfLocalToday(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

type LeanProduct = {
  _id: Types.ObjectId;
  name: string;
  price: number;
  stockCount: number;
  lowStockThreshold: number;
  thumbnailUrl?: string | null;
  mainCategory?: string;
  subCategory?: string;
  category?: string;
};

function resolveMenuFields(doc: LeanProduct): {
  mainCategory: MainCategory;
  subCategory: string;
} {
  if (doc.mainCategory && doc.subCategory) {
    return {
      mainCategory: doc.mainCategory as MainCategory,
      subCategory: doc.subCategory,
    };
  }
  if (doc.category) {
    return legacyCategoryToMenu(doc.category);
  }
  return { mainCategory: "Merchandise", subCategory: NONE_SUBCATEGORY };
}

function toProductDTO(doc: LeanProduct): ProductDTO {
  const { mainCategory, subCategory } = resolveMenuFields(doc);
  const thumb =
    doc.thumbnailUrl?.trim() ||
    MAIN_CATEGORY_THUMB_FALLBACK[mainCategory] ||
    MAIN_CATEGORY_THUMB_FALLBACK.Merchandise;
  return {
    _id: doc._id.toString(),
    name: doc.name,
    mainCategory,
    subCategory,
    price: doc.price,
    stockCount: doc.stockCount,
    lowStockThreshold: doc.lowStockThreshold,
    thumbnailUrl: thumb,
  };
}

export async function loadDashboardData(): Promise<{
  products: ProductDTO[];
  lowStockProducts: ProductDTO[];
  todaySummary: TodaySummary;
  fastestFlavor: FastestFlavor;
}> {
  await connectDB();
  await ensureSeedProducts();

  const { start, end } = startEndOfLocalToday();

  const [products, salesToday, agg] = await Promise.all([
    Product.find()
      .sort({ mainCategory: 1, subCategory: 1, name: 1 })
      .lean(),
    Sale.find({
      timestamp: { $gte: start, $lte: end },
    }).lean(),
    Sale.aggregate<{
      _id: Types.ObjectId;
      unitsSold: number;
    }>([
      { $match: { timestamp: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          unitsSold: { $sum: "$items.qty" },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 1 },
    ]),
  ]);

  const productDTOs = (products as LeanProduct[]).map(toProductDTO);
  const lowStockProducts = productDTOs.filter(
    (p) => p.stockCount < p.lowStockThreshold,
  );

  let upiTotal = 0;
  let cashTotal = 0;
  for (const s of salesToday) {
    if (s.paymentMethod === "UPI") upiTotal += s.totalAmount;
    else cashTotal += s.totalAmount;
  }

  let fastestFlavor: FastestFlavor = null;
  if (agg.length > 0 && agg[0]._id) {
    const top = await Product.findById(agg[0]._id).lean();
    if (top) {
      const dto = toProductDTO(top as LeanProduct);
      fastestFlavor = {
        productId: dto._id,
        name: dto.name,
        unitsSold: agg[0].unitsSold,
      };
    }
  }

  return {
    products: productDTOs,
    lowStockProducts,
    todaySummary: {
      upiTotal,
      cashTotal,
      saleCount: salesToday.length,
    },
    fastestFlavor,
  };
}
