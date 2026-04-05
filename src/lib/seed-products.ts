import { Product } from "@/models/Product";
import type { MainCategory, ProductSubCategory } from "@/lib/menu-categories";

type SeedRow = {
  name: string;
  mainCategory: MainCategory;
  subCategory: ProductSubCategory;
  price: number;
  stockCount: number;
  lowStockThreshold: number;
  thumbnailUrl: string;
};

const DEMO_PRODUCTS: SeedRow[] = [
  {
    name: "Vanilla Bar",
    mainCategory: "Popsicles",
    subCategory: "Classic",
    price: 60,
    stockCount: 40,
    lowStockThreshold: 10,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Chocolate Bar",
    mainCategory: "Popsicles",
    subCategory: "Chocolate",
    price: 60,
    stockCount: 8,
    lowStockThreshold: 10,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1497034825429-c943d7a70338?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Mango Sipup",
    mainCategory: "Sipups",
    subCategory: "None",
    price: 50,
    stockCount: 24,
    lowStockThreshold: 8,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Berry Blast Sipup",
    mainCategory: "Sipups",
    subCategory: "None",
    price: 55,
    stockCount: 5,
    lowStockThreshold: 8,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Family Pack (Mixed)",
    mainCategory: "Packs",
    subCategory: "None",
    price: 320,
    stockCount: 12,
    lowStockThreshold: 3,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Party Box (12)",
    mainCategory: "Packs",
    subCategory: "None",
    price: 280,
    stockCount: 6,
    lowStockThreshold: 2,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1587567337167-aa9ba64bcfa2?w=400&h=400&fit=crop&q=80",
  },
];

export async function ensureSeedProducts(): Promise<void> {
  const count = await Product.countDocuments();
  if (count > 0) return;
  await Product.insertMany(DEMO_PRODUCTS);
}
