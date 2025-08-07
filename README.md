# AJIO Clone – E-commerce Backend

A serverless backend for the AJIO clone, powered by Netlify Functions and Supabase (Postgres + Storage). Exposes RESTful product and cart APIs, and serves images from Supabase Storage.


---

## Features

### Product API  
- **List all products**  
  `GET /.netlify/functions/products`  
  – returns `[{ id, name, image }, …]`  
- **Get single product**  
  `GET /.netlify/functions/products/{id}`  
  – returns `{ title, description, short_description, ratings, review_count, actual_price, discounted_price, discount_percentage, additional_details, image_path }`

### Cart API  
- **Create a cart**  
  `POST /.netlify/functions/cart`  
  – body `{ userId }` → returns `{ cartId }`  
- **Get cart items**  
  `GET /.netlify/functions/cart/{cartId}`  
  – returns `[{ product_id, quantity }, …]`  
- **Add/update cart item**  
  `PUT /.netlify/functions/cart/{cartId}`  
  – body `{ productId, quantity }` → returns `{ productId, quantity }`  
- **Lookup cart by user**  
  `GET /.netlify/functions/cart/user/{userId}`  
  – returns `{ cartId }`

### Image Storage  
- Images are stored in Supabase Storage bucket `ajio-bucket`  
- Table `products.image_path` holds the key (e.g. `products/widget-123.png`)  
- Functions generate `publicURL`s for client consumption

---

## Tech Stack

- **Serverless**: Netlify Functions  
- **Database**: Supabase (Postgres + `uuid-ossp`, `jsonb`)  
- **Storage**: Supabase Storage (S3-compatible)  
- **Language**: Node.js (ESM/CommonJS)  
- **Deploy**: Netlify CLI & Build

---

## Prerequisites

- Node.js v14+  
- npm or yarn  
- Supabase project with:
  - **Database** (tables below)
  - **Storage** bucket named `ajio-bucket`
- Netlify account & Netlify CLI

---

## Database Schema

Run in Supabase SQL editor:

```sql
-- enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- products
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
  image_path           TEXT    -- e.g. "products/widget-123.png"
);

-- carts
CREATE TABLE public.carts (
  id      UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT    NOT NULL
);

-- cart_items
CREATE TABLE public.cart_items (
  id         UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id    UUID    REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID    REFERENCES public.products(id),
  quantity   INTEGER NOT NULL
);

CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
