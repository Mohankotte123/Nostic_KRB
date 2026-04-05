import "server-only";

import type { FranchiseDetails } from "@/types/franchise";

export type { FranchiseDetails };

/**
 * Branding for invoices/receipts. Override via environment (see .env.example).
 */
export function getFranchiseDetails(): FranchiseDetails {
  const rawAddress = process.env.NOSTIC_FRANCHISE_ADDRESS?.trim();
  const addressLines = rawAddress
    ? rawAddress.split("|").map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    tradingName:
      process.env.NOSTIC_FRANCHISE_NAME?.trim() || "Nostic Foods",
    legalName: process.env.NOSTIC_FRANCHISE_LEGAL_NAME?.trim() || undefined,
    addressLines:
      addressLines.length > 0
        ? addressLines
        : [
            process.env.NOSTIC_FRANCHISE_ADDRESS_LINE?.trim() ||
              "Franchise outlet — India",
          ],
    gstin: process.env.NOSTIC_FRANCHISE_GSTIN?.trim() || undefined,
    phone: process.env.NOSTIC_FRANCHISE_PHONE?.trim() || undefined,
    email: process.env.NOSTIC_FRANCHISE_EMAIL?.trim() || undefined,
    storeCode: process.env.NOSTIC_STORE_CODE?.trim() || undefined,
    tagline:
      process.env.NOSTIC_FRANCHISE_TAGLINE?.trim() ||
      "Premium frozen treats & beverages",
  };
}
