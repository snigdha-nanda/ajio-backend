# AJIO Clone – E-commerce Backend

A serverless backend for the AJIO clone, powered by Netlify Functions and Supabase. Provides authenticated product and cart management APIs.

## Authentication

All write operations require authentication:
- **Dev Mode**: Headers `X-Dev-Key: <DEV_API_KEY>` and `X-User-Id: <user-id>`
- **Production**: Header `Authorization: Bearer <firebase-id-token>`

## API Documentation

- **Interactive Docs**: Open `swagger-ui.html` in browser for testing
- **OpenAPI Spec**: `GET /docs` returns OpenAPI 3.0 specification
- **Live Testing**: Test all endpoints directly in the browser interface

## API Endpoints

### Products
- `GET /products` - List all products (public)
- `GET /products?id={id}` - Get single product (public)
- `POST /products` - Create product (authenticated)
- `PUT /products?id={id}` - Update product (authenticated)

### Cart
- `GET /cart` - Get user cart (authenticated, read-only)
- `GET /cart?id={cartId}` - Get cart items (authenticated, read-only)
- `POST /cart` - Create cart for user (authenticated)
- `PUT /cart?id={cartId}` - Add/update cart item (authenticated)

### Config
- `GET /config` - Get all config values (public)
- `GET /config?key={key}` - Get specific config value (public)
- `POST /config` - Create config value (authenticated)
- `PUT /config` - Update config value (authenticated)

### Documentation
- `GET /docs` - Get OpenAPI specification (public)

## Tech Stack

- **Serverless**: Netlify Functions
- **Database**: Supabase (Postgres)
- **Auth**: Firebase ID tokens + dev mode
- **Documentation**: OpenAPI 3.0 + Swagger UI
- **Language**: Node.js

## Setup

1. Install dependencies: `npm install`
2. Configure environment variables in `.env.local`
3. Set up Supabase database with schema below
4. Deploy: `netlify deploy`
5. Open `swagger-ui.html` for interactive API testing

## Database Schema

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.products (
  id                   UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                TEXT    NOT NULL,
  description          TEXT    NOT NULL,
  short_description    TEXT,
  ratings              NUMERIC,
  review_count         INTEGER,
  actual_price         NUMERIC,
  discounted_price     NUMERIC,
  discount_percentage  NUMERIC,
  additional_details   JSONB,
  image_path           TEXT
);

CREATE TABLE public.carts (
  id      UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT    NOT NULL
);

CREATE TABLE public.cart_items (
  id         UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id    UUID    REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID    REFERENCES public.products(id),
  quantity   INTEGER NOT NULL
);

CREATE TABLE public.config (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
```
