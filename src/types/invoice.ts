import type { FranchiseDetails } from "@/types/franchise";

export type InvoiceLine = {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoicePayload = {
  franchise: FranchiseDetails;
  orderId: string;
  soldAtIso: string;
  paymentMethod: "UPI" | "Cash";
  lines: InvoiceLine[];
  totalAmount: number;
  isDraft?: boolean;
};
