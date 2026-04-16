# CestaSmart

Comparador de precios de supermercados en España para optimizar la cesta de la compra.

## Estructura

- `apps/web`: aplicación web (Next.js).
- `apps/api`: API backend (Node.js + TypeScript + Express).
- `packages/shared`: tipos y utilidades compartidas.
- `docs`: documentación funcional y técnica.

## Arranque

1. Instala dependencias: `pnpm install`.
2. Ejecuta API: `pnpm dev:api`.
3. Ejecuta web: `pnpm dev:web`.
4. Abre `http://localhost:3000`.

## API inicial disponible

- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`
- `GET /api/v1/retailers?zone=28001`
- `GET /api/v1/products/search?q=ketchup`
- `GET /api/v1/products/:productId/compare?zone=28001`
- `POST /api/v1/cart/optimize` (`single_store | min_cost_split | balanced`)
- `POST /api/v1/cart/ticket`

## Estado actual

Esta versión inicial ya permite:

- registro/login básico,
- búsqueda de productos,
- comparación de precios por zona,
- desglose de base/promo/fidelización,
- cálculo inicial de cesta con estrategia configurable y costes de envío,
- generación de ticket final agrupado por supermercado.

## Limitaciones de esta versión

- Persistencia en memoria (sin base de datos todavía).
- Token de sesión simple (siguiente paso: JWT + refresh).
- Estrategia `balanced` inicial (se mejorará con optimización más avanzada).
