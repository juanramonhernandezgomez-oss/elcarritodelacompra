export type PriceKind = "base" | "fidelizacion" | "promo";

export type SaleChannel = "online" | "presencial";

export type OptimizationStrategy = "single_store" | "min_cost_split" | "balanced";

export interface ProductReference {
  ean: string;
  brand: string;
  name: string;
  format: string;
}

export interface Retailer {
  id: string;
  name: string;
  zones: string[];
  channels: SaleChannel[];
  shippingCost: number;
  minimumOrder: number;
}

export interface Product extends ProductReference {
  id: string;
  category: string;
}

export interface PriceOffer {
  productId: string;
  retailerId: string;
  kind: PriceKind;
  price: number;
  updatedAt: string;
}

export interface CompareResult {
  product: Product;
  offers: Array<{
    retailerId: string;
    retailerName: string;
    finalPrice: number | null;
    shippingCost: number;
    minimumOrder: number;
    breakdown: {
      base?: number;
      fidelizacion?: number;
      promo?: number;
    };
  }>;
}

export interface TicketLine {
  productName: string;
  price: number;
}

export interface TicketStore {
  retailerId: string;
  retailerName: string;
  lines: TicketLine[];
  subtotal: number;
  shipping: number;
  total: number;
}

export interface Ticket {
  supermarkets: TicketStore[];
  grandTotal: number;
}
