/** Nostic menu structure — main tabs on POS + validation for products. */

export const MAIN_CATEGORIES = [
  "Popsicles",
  "Sipups",
  "Packs",
  "Merchandise",
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];

export const POPSICLE_SUB_CATEGORIES = [
  "Classic",
  "Fruit",
  "Chocolate",
  "Kulfi",
  "Premium",
] as const;

export type PopsicleSubCategory = (typeof POPSICLE_SUB_CATEGORIES)[number];

export const NONE_SUBCATEGORY = "None" as const;

export const ALL_SUBCATEGORIES_FOR_SCHEMA = [
  ...POPSICLE_SUB_CATEGORIES,
  NONE_SUBCATEGORY,
] as const;

export type ProductSubCategory =
  | PopsicleSubCategory
  | typeof NONE_SUBCATEGORY;

export function isPopsiclesMain(main: string): boolean {
  return main === "Popsicles";
}

export function defaultSubCategoryForMain(main: MainCategory): ProductSubCategory {
  return main === "Popsicles" ? POPSICLE_SUB_CATEGORIES[0] : NONE_SUBCATEGORY;
}

/** Map legacy DB `category` (Scoop / Kulfi / Pack) to the new menu. */
export function legacyCategoryToMenu(category: string): {
  mainCategory: MainCategory;
  subCategory: ProductSubCategory;
} {
  switch (category) {
    case "Scoop":
      return { mainCategory: "Popsicles", subCategory: "Classic" };
    case "Kulfi":
      return { mainCategory: "Sipups", subCategory: NONE_SUBCATEGORY };
    case "Pack":
      return { mainCategory: "Packs", subCategory: NONE_SUBCATEGORY };
    default:
      return { mainCategory: "Merchandise", subCategory: NONE_SUBCATEGORY };
  }
}

export function categoryLabel(main: MainCategory, sub: string): string {
  if (main === "Popsicles" && sub && sub !== NONE_SUBCATEGORY) {
    return `${main} · ${sub}`;
  }
  return main;
}
