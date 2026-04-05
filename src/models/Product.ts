import mongoose, { Schema, type InferSchemaType, models, model } from "mongoose";
import {
  ALL_SUBCATEGORIES_FOR_SCHEMA,
  MAIN_CATEGORIES,
} from "@/lib/menu-categories";

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mainCategory: {
      type: String,
      required: true,
      enum: MAIN_CATEGORIES,
    },
    subCategory: {
      type: String,
      required: true,
      enum: ALL_SUBCATEGORIES_FOR_SCHEMA,
    },
    price: { type: Number, required: true, min: 0 },
    stockCount: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 8 },
    thumbnailUrl: { type: String, trim: true },
  },
  { timestamps: true },
);

productSchema.pre("validate", async function () {
  const main = this.get("mainCategory") as string;
  const sub = this.get("subCategory") as string;
  if (main === "Popsicles") {
    if (sub === "None") {
      throw new Error(
        "Popsicles require a popsicle sub-category (not None).",
      );
    }
  } else if (sub !== "None") {
    throw new Error(
      "subCategory must be None when mainCategory is not Popsicles.",
    );
  }
});

export type ProductDocument = InferSchemaType<typeof productSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Product =
  models.Product ?? model("Product", productSchema);
