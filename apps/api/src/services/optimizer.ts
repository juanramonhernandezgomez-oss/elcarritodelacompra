import { products, retailers } from "../data.js";
import type { Assignment, Strategy } from "../types.js";

export type PriceLookup = (productId: string, retailerId: string) => number | null;

function getAvailableRetailersByZone(zone?: string) {
  return zone ? retailers.filter((retailer) => retailer.zones.includes(zone)) : retailers;
}

function calculateShippingForUsedRetailers(usedRetailerIds: string[]) {
  return usedRetailerIds.reduce((sum, retailerId) => {
    const retailer = retailers.find((item) => item.id === retailerId);
    return sum + (retailer?.shippingCost ?? 0);
  }, 0);
}

export function optimizeCart(
  productIds: string[],
  zone: string | undefined,
  strategy: Strategy,
  getBestPrice: PriceLookup
) {
  if (strategy === "single_store") {
    return optimizeForSingleStore(productIds, zone, getBestPrice);
  }

  return optimizeForSplit(productIds, zone, strategy, getBestPrice);
}

function optimizeForSingleStore(productIds: string[], zone: string | undefined, getBestPrice: PriceLookup) {
  const availableRetailers = getAvailableRetailersByZone(zone);

  const candidates = availableRetailers.map((retailer) => {
    const items: Assignment[] = productIds.map((productId) => {
      const price = getBestPrice(productId, retailer.id);
      const product = products.find((item) => item.id === productId);
      return {
        productId,
        productName: product?.name ?? productId,
        assignment: price
          ? {
              retailerId: retailer.id,
              retailerName: retailer.name,
              price
            }
          : null
      };
    });

    const subtotal = items.reduce((sum, item) => sum + (item.assignment?.price ?? 0), 0);
    const withShipping = subtotal >= retailer.minimumOrder ? subtotal + retailer.shippingCost : subtotal;
    const unavailableCount = items.filter((item) => !item.assignment).length;

    return {
      retailerName: retailer.name,
      items,
      unavailableCount,
      total: withShipping
    };
  });

  const best = candidates.sort((a, b) => a.unavailableCount - b.unavailableCount || a.total - b.total)[0];

  return {
    strategy: "single_store" as const,
    zone: zone ?? null,
    items: best.items,
    total: best.total,
    meta: { chosenRetailer: best.retailerName, shippingTotal: 0 }
  };
}

function optimizeForSplit(
  productIds: string[],
  zone: string | undefined,
  strategy: Exclude<Strategy, "single_store">,
  getBestPrice: PriceLookup
) {
  const availableRetailers = getAvailableRetailersByZone(zone);

  const items: Assignment[] = productIds.map((productId) => {
    const candidates = availableRetailers
      .map((retailer) => {
        const price = getBestPrice(productId, retailer.id);

        if (price === null) {
          return null;
        }

        return {
          retailerId: retailer.id,
          retailerName: retailer.name,
          price
        };
      })
      .filter((value): value is { retailerId: string; retailerName: string; price: number } => Boolean(value))
      .sort((a, b) => a.price - b.price);

    const product = products.find((item) => item.id === productId);

    if (strategy === "balanced" && candidates.length > 1) {
      const best = candidates[0];
      const second = candidates[1];
      const priceDelta = second.price - best.price;

      if (priceDelta <= 0.2) {
        return {
          productId,
          productName: product?.name ?? productId,
          assignment: second
        };
      }
    }

    return {
      productId,
      productName: product?.name ?? productId,
      assignment: candidates[0] ?? null
    };
  });

  const usedRetailers = Array.from(
    new Set(items.filter((item) => item.assignment).map((item) => item.assignment?.retailerId ?? ""))
  ).filter(Boolean);

  const subtotal = items.reduce((sum, item) => sum + (item.assignment?.price ?? 0), 0);
  const shippingTotal = calculateShippingForUsedRetailers(usedRetailers);

  return {
    strategy,
    zone: zone ?? null,
    items,
    total: subtotal + shippingTotal,
    meta: { shippingTotal }
  };
}

export function generateTicket(items: Assignment[]) {
  const grouped = new Map<string, { retailerName: string; lines: Array<{ productName: string; price: number }>; subtotal: number }>();

  for (const item of items) {
    if (!item.assignment) {
      continue;
    }

    const key = item.assignment.retailerId;
    const current = grouped.get(key) ?? {
      retailerName: item.assignment.retailerName,
      lines: [],
      subtotal: 0
    };

    current.lines.push({ productName: item.productName, price: item.assignment.price });
    current.subtotal += item.assignment.price;
    grouped.set(key, current);
  }

  const supermarkets = Array.from(grouped.entries()).map(([retailerId, value]) => {
    const retailer = retailers.find((item) => item.id === retailerId);
    const shipping = retailer?.shippingCost ?? 0;
    const total = value.subtotal + shipping;

    return {
      retailerId,
      retailerName: value.retailerName,
      lines: value.lines,
      subtotal: value.subtotal,
      shipping,
      total
    };
  });

  const grandTotal = supermarkets.reduce((sum, store) => sum + store.total, 0);

  return {
    supermarkets,
    grandTotal
  };
}
