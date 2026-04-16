import crypto from "node:crypto";
import express from "express";
import { offers, products, retailers, sessions, users } from "./data.js";
import { createPasswordHash, verifyPassword } from "./services/auth.js";
import { generateTicket, optimizeCart } from "./services/optimizer.js";
import type { Assignment, Strategy } from "./types.js";

const app = express();
app.use(express.json());

function getBestProductPriceByRetailer(productId: string, retailerId: string): number | null {
  const prices = offers
    .filter((offer) => offer.productId === productId && offer.retailerId === retailerId)
    .map((offer) => offer.price);

  return prices.length > 0 ? Math.min(...prices) : null;
}

function getAuthUser(req: express.Request) {
  const authHeader = req.header("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  if (!token || !sessions.has(token)) {
    return null;
  }

  const userId = sessions.get(token);
  return users.find((item) => item.id === userId) ?? null;
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "cestasmart-api" });
});

app.post("/api/v1/auth/register", async (req, res) => {
  const { email, password, name } = req.body as { email?: string; password?: string; name?: string };

  if (!email || !password || !name) {
    return res.status(400).json({ error: "name, email y password son obligatorios" });
  }

  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: "El email ya está registrado" });
  }

  const id = crypto.randomUUID();
  const { salt, passwordHash } = await createPasswordHash(password);
  users.push({ id, email, passwordHash, salt, name });

  return res.status(201).json({ id, email, name });
});

app.post("/api/v1/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  const user = users.find((item) => item.email.toLowerCase() === email?.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const isValidPassword = await verifyPassword(password ?? "", user.salt, user.passwordHash);

  if (!isValidPassword) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = crypto.randomUUID();
  sessions.set(token, user.id);

  return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.post("/api/v1/auth/logout", (req, res) => {
  const authHeader = req.header("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  if (token) {
    sessions.delete(token);
  }

  return res.status(204).send();
});

app.get("/api/v1/me", (req, res) => {
  const user = getAuthUser(req);

  if (!user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  return res.json({ id: user.id, email: user.email, name: user.name });
});

app.get("/api/v1/retailers", (req, res) => {
  const zone = String(req.query.zone ?? "").trim();

  if (!zone) {
    return res.json(retailers);
  }

  return res.json(retailers.filter((retailer) => retailer.zones.includes(zone)));
});

app.get("/api/v1/products/search", (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();

  if (!q) {
    return res.json([]);
  }

  const results = products.filter(
    (product) =>
      product.name.toLowerCase().includes(q) ||
      product.brand.toLowerCase().includes(q) ||
      product.ean.includes(q)
  );

  return res.json(results);
});

app.get("/api/v1/products/:productId/compare", (req, res) => {
  const { productId } = req.params;
  const zone = String(req.query.zone ?? "").trim();

  const product = products.find((item) => item.id === productId);

  if (!product) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  const zoneRetailers = zone ? retailers.filter((retailer) => retailer.zones.includes(zone)) : retailers;

  const comparison = zoneRetailers.map((retailer) => {
    const retailerOffers = offers.filter((offer) => offer.productId === productId && offer.retailerId === retailer.id);
    const base = retailerOffers.find((offer) => offer.kind === "base")?.price;
    const fidelizacion = retailerOffers.find((offer) => offer.kind === "fidelizacion")?.price;
    const promo = retailerOffers.find((offer) => offer.kind === "promo")?.price;
    const candidates = [base, fidelizacion, promo].filter((value): value is number => typeof value === "number");

    if (candidates.length === 0) {
      return {
        retailerId: retailer.id,
        retailerName: retailer.name,
        shippingCost: retailer.shippingCost,
        minimumOrder: retailer.minimumOrder,
        available: false,
        finalPrice: null,
        breakdown: { base, fidelizacion, promo }
      };
    }

    return {
      retailerId: retailer.id,
      retailerName: retailer.name,
      shippingCost: retailer.shippingCost,
      minimumOrder: retailer.minimumOrder,
      available: true,
      finalPrice: Math.min(...candidates),
      breakdown: { base, fidelizacion, promo }
    };
  });

  return res.json({ product, comparison });
});

app.post("/api/v1/cart/optimize", (req, res) => {
  const { productIds, zone, strategy } = req.body as { productIds?: string[]; zone?: string; strategy?: Strategy };

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: "Debes enviar una lista de productIds" });
  }

  const selectedStrategy: Strategy = strategy ?? "min_cost_split";
  return res.json(optimizeCart(productIds, zone, selectedStrategy, getBestProductPriceByRetailer));
});

app.post("/api/v1/cart/ticket", (req, res) => {
  const { items } = req.body as { items?: Assignment[] };

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "Debes enviar los items de optimización" });
  }

  return res.json(generateTicket(items));
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`CestaSmart API running on http://localhost:${port}`);
});
