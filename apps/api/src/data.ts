export type PriceKind = "base" | "fidelizacion" | "promo";
export type SaleChannel = "online" | "presencial";

export interface Retailer {
  id: string;
  name: string;
  zones: string[];
  channels: SaleChannel[];
  shippingCost: number;
  minimumOrder: number;
}

export interface Product {
  id: string;
  ean: string;
  brand: string;
  name: string;
  format: string;
  category: string;
}

export interface PriceOffer {
  productId: string;
  retailerId: string;
  kind: PriceKind;
  price: number;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
}

export const users: User[] = [];
export const sessions = new Map<string, string>();

export const retailers: Retailer[] = [
  {
    id: "carrefour",
    name: "Carrefour",
    zones: ["28001", "08001"],
    channels: ["online", "presencial"],
    shippingCost: 6.99,
    minimumOrder: 35
  },
  {
    id: "dia",
    name: "DIA",
    zones: ["28001", "41001"],
    channels: ["online", "presencial"],
    shippingCost: 4.99,
    minimumOrder: 25
  },
  {
    id: "alcampo",
    name: "Alcampo",
    zones: ["28001", "46001"],
    channels: ["online", "presencial"],
    shippingCost: 5.99,
    minimumOrder: 30
  }
];

export const products: Product[] = [
  {
    id: "heinz-ketchup-570",
    ean: "8715700110621",
    brand: "Heinz",
    name: "Ketchup Heinz",
    format: "570 g",
    category: "salsas"
  },
  {
    id: "coca-cola-2l",
    ean: "5449000000996",
    brand: "Coca-Cola",
    name: "Coca-Cola Sabor Original",
    format: "2 L",
    category: "bebidas"
  },
  {
    id: "arroz-sos-1kg",
    ean: "8410109203009",
    brand: "SOS",
    name: "Arroz SOS Redondo",
    format: "1 kg",
    category: "despensa"
  }
];

export const offers: PriceOffer[] = [
  { productId: "heinz-ketchup-570", retailerId: "carrefour", kind: "base", price: 3.1, updatedAt: new Date().toISOString() },
  { productId: "heinz-ketchup-570", retailerId: "carrefour", kind: "promo", price: 2.75, updatedAt: new Date().toISOString() },
  { productId: "heinz-ketchup-570", retailerId: "dia", kind: "base", price: 3.05, updatedAt: new Date().toISOString() },
  { productId: "heinz-ketchup-570", retailerId: "alcampo", kind: "base", price: 2.95, updatedAt: new Date().toISOString() },
  { productId: "coca-cola-2l", retailerId: "carrefour", kind: "base", price: 2.15, updatedAt: new Date().toISOString() },
  { productId: "coca-cola-2l", retailerId: "dia", kind: "promo", price: 1.79, updatedAt: new Date().toISOString() },
  { productId: "coca-cola-2l", retailerId: "alcampo", kind: "base", price: 1.95, updatedAt: new Date().toISOString() },
  { productId: "arroz-sos-1kg", retailerId: "carrefour", kind: "base", price: 2.09, updatedAt: new Date().toISOString() },
  { productId: "arroz-sos-1kg", retailerId: "dia", kind: "base", price: 1.99, updatedAt: new Date().toISOString() },
  { productId: "arroz-sos-1kg", retailerId: "alcampo", kind: "promo", price: 1.75, updatedAt: new Date().toISOString() }
];
