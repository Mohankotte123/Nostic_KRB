import mongoose, { Schema, type InferSchemaType, models, model } from "mongoose";

const saleItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const saleSchema = new Schema(
  {
    orderId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    items: { type: [saleItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["UPI", "Cash"],
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

export type SaleDocument = InferSchemaType<typeof saleSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Sale = models.Sale ?? model("Sale", saleSchema);
