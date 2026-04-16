"use client";

import { FormEvent, useMemo, useState } from "react";

type Product = {
  id: string;
  ean: string;
  brand: string;
  name: string;
  format: string;
  category: string;
};

type Comparison = {
  retailerId: string;
  retailerName: string;
  shippingCost: number;
  minimumOrder: number;
  available: boolean;
  finalPrice: number | null;
  breakdown: {
    base?: number;
    fidelizacion?: number;
    promo?: number;
  };
};

type Strategy = "single_store" | "min_cost_split" | "balanced";

type OptimizedItem = {
  productId: string;
  productName: string;
  assignment: { retailerId?: string; retailerName: string; price: number } | null;
};

type Ticket = {
  supermarkets: Array<{
    retailerId: string;
    retailerName: string;
    lines: Array<{ productName: string; price: number }>;
    subtotal: number;
    shipping: number;
    total: number;
  }>;
  grandTotal: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export default function HomePage() {
  const [zone, setZone] = useState("28001");
  const [query, setQuery] = useState("Ketchup Heinz");
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [comparison, setComparison] = useState<Comparison[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<Strategy>("min_cost_split");
  const [optimized, setOptimized] = useState<null | { total: number; strategy: Strategy; items: OptimizedItem[]; meta?: { shippingTotal?: number; chosenRetailer?: string } }>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [email, setEmail] = useState("demo@cestasmart.app");
  const [password, setPassword] = useState("demo1234");
  const [name, setName] = useState("Usuario Demo");
  const [token, setToken] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string>("No autenticado");
  const [error, setError] = useState<string | null>(null);

  const sortedComparison = useMemo(
    () => [...comparison].sort((a, b) => (a.finalPrice ?? Number.MAX_VALUE) - (b.finalPrice ?? Number.MAX_VALUE)),
    [comparison]
  );

  async function request(path: string, options?: RequestInit) {
    const response = await fetch(`${API_BASE}${path}`, options);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? `Error ${response.status}`);
    }
    return response.status === 204 ? null : response.json();
  }

  async function onRegister(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });
      setAuthMessage("Registro completado. Ahora inicia sesión.");
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const data = (await request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })) as { token: string; user: { name: string } };
      setToken(data.token);
      setAuthMessage(`Sesión iniciada como ${data.user.name}`);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const data = (await request(`/products/search?q=${encodeURIComponent(query)}`)) as Product[];
      setProducts(data);
      setSelected(null);
      setComparison([]);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function compareProduct(product: Product) {
    setError(null);
    try {
      setSelected(product);
      const data = (await request(`/products/${product.id}/compare?zone=${encodeURIComponent(zone)}`)) as {
        comparison: Comparison[];
      };
      setComparison(data.comparison);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function optimizeCart() {
    setError(null);
    setTicket(null);
    if (cart.length === 0) {
      setError("Añade al menos un producto al carrito.");
      return;
    }

    try {
      const data = (await request("/cart/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: cart, zone, strategy })
      })) as {
        total: number;
        strategy: Strategy;
        items: OptimizedItem[];
        meta?: { shippingTotal?: number; chosenRetailer?: string };
      };
      setOptimized(data);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function buildTicket() {
    setError(null);
    if (!optimized) {
      setError("Primero debes optimizar la cesta.");
      return;
    }

    const payloadItems = optimized.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      assignment: item.assignment
    }));

    try {
      const data = (await request("/cart/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems })
      })) as Ticket;
      setTicket(data);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 1100, margin: "20px auto", padding: "0 16px" }}>
      <h1>CestaSmart · Versión inicial usable</h1>
      <p>Incluye registro/login, búsqueda, comparativa por zona y optimizador básico de cesta.</p>

      <section style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16 }}>
        <h2>Cuenta</h2>
        <p>{authMessage}</p>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(220px, 1fr))" }}>
          <form onSubmit={onRegister} style={{ display: "grid", gap: 8 }}>
            <strong>Registro</strong>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre" />
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
            <button type="submit">Crear cuenta</button>
          </form>
          <form onSubmit={onLogin} style={{ display: "grid", gap: 8 }}>
            <strong>Login</strong>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
            <button type="submit">Entrar</button>
          </form>
        </div>
        <small>Token activo: {token ? `${token.slice(0, 8)}...` : "sin token"}</small>
      </section>

      <form onSubmit={onSearch} style={{ display: "grid", gap: 8, marginBottom: 20 }}>
        <label>
          Zona (CP)
          <input value={zone} onChange={(event) => setZone(event.target.value)} style={{ marginLeft: 8 }} />
        </label>
        <label>
          Producto
          <input value={query} onChange={(event) => setQuery(event.target.value)} style={{ marginLeft: 8, minWidth: 280 }} />
        </label>
        <button type="submit">Buscar</button>
      </form>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <section>
        <h2>Resultados</h2>
        {products.length === 0 ? <p>Sin resultados todavía.</p> : null}
        <ul>
          {products.map((product) => (
            <li key={product.id} style={{ marginBottom: 10 }}>
              <strong>{product.name}</strong> · {product.brand} · {product.format}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => compareProduct(product)}>
                  Comparar
                </button>
                <button type="button" onClick={() => setCart((prev) => (prev.includes(product.id) ? prev : [...prev, product.id]))}>
                  Añadir al carrito
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Comparativa {selected ? `· ${selected.name}` : ""}</h2>
        {sortedComparison.length === 0 ? <p>Selecciona un producto para comparar.</p> : null}
        <ul>
          {sortedComparison.map((item) => (
            <li key={item.retailerId}>
              {item.retailerName}: {item.available ? `${item.finalPrice?.toFixed(2)} €` : "No disponible"}
              <small>
                {" "}
                (base: {item.breakdown.base ?? "-"} · fidelización: {item.breakdown.fidelizacion ?? "-"} · promo: {item.breakdown.promo ?? "-"} · envío: {item.shippingCost}€ · pedido mín.: {item.minimumOrder}€)
              </small>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Carrito</h2>
        <p>{cart.length} producto(s)</p>
        <label>
          Estrategia
          <select value={strategy} onChange={(event) => setStrategy(event.target.value as Strategy)} style={{ marginLeft: 8 }}>
            <option value="single_store">Todo en un súper</option>
            <option value="min_cost_split">Mínimo coste total</option>
            <option value="balanced">Equilibrio</option>
          </select>
        </label>
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button type="button" onClick={optimizeCart}>
            Optimizar cesta
          </button>
          <button type="button" onClick={buildTicket}>
            Generar ticket
          </button>
        </div>

        {optimized ? (
          <div style={{ marginTop: 10 }}>
            <p>
              <strong>Estrategia:</strong> {optimized.strategy}
            </p>
            <p>
              <strong>Total estimado:</strong> {optimized.total.toFixed(2)} €
            </p>
            {optimized.meta?.shippingTotal !== undefined ? <p>Envío total estimado: {optimized.meta.shippingTotal.toFixed(2)} €</p> : null}
            {optimized.meta?.chosenRetailer ? <p>Supermercado elegido: {optimized.meta.chosenRetailer}</p> : null}
            <ul>
              {optimized.items.map((item) => (
                <li key={item.productName}>
                  {item.productName} → {item.assignment ? `${item.assignment.retailerName} (${item.assignment.price.toFixed(2)} €)` : "No disponible"}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {ticket ? (
          <div style={{ marginTop: 12, borderTop: "1px solid #ddd", paddingTop: 10 }}>
            <h3>Ticket final</h3>
            {ticket.supermarkets.map((store) => (
              <div key={store.retailerId} style={{ marginBottom: 10 }}>
                <strong>{store.retailerName}</strong>
                <ul>
                  {store.lines.map((line) => (
                    <li key={`${store.retailerId}-${line.productName}`}>
                      {line.productName}: {line.price.toFixed(2)} €
                    </li>
                  ))}
                </ul>
                <small>
                  Subtotal: {store.subtotal.toFixed(2)} € · Envío: {store.shipping.toFixed(2)} € · Total tienda: {store.total.toFixed(2)} €
                </small>
              </div>
            ))}
            <p>
              <strong>Total global ticket:</strong> {ticket.grandTotal.toFixed(2)} €
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
