export type Strategy = "single_store" | "min_cost_split" | "balanced";

export type Assignment = {
  productId: string;
  productName: string;
  assignment: {
    retailerId: string;
    retailerName: string;
    price: number;
  } | null;
};
