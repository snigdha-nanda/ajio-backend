
const BASE = process.env.REACT_APP_API_BASE || '';

async function authHeaders() {
  if (process.env.REACT_APP_USE_DEV_AUTH === 'true') {
    return {
      'X-Dev-Key': process.env.REACT_APP_DEV_API_KEY,
      'X-User-Id': process.env.REACT_APP_DEV_USER_ID || 'dev-user',
    };
  }
  // Firebase path
  const { auth } = await import('../firebase');
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/** ---------- Products ---------- */
export async function listProducts() {
  const res = await fetch(`${BASE}/products`);
  if (!res.ok) throw new Error('Failed to load products');
  // map backend -> UI shape minimally
  const rows = await res.json(); // [{id,name,image}]
  return rows.map(p => ({
    id: p.id,
    title: p.name,
    image: p.image,
    price: undefined, // can be shown when you hit detail
  }));
}

export async function getProduct(id) {
  const res = await fetch(`${BASE}/products?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to load product');
  const p = await res.json();
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    image: p.image_path,
    price: p.discounted_price ?? p.actual_price ?? 0,
    actual_price: p.actual_price,
    discounted_price: p.discounted_price,
    rating: p.ratings,
    review_count: p.review_count,
    raw: p,
  };
}

/** ---------- Cart ---------- */
export async function ensureCart() {
  const headers = await authHeaders();
  // try get
  let res = await fetch(`${BASE}/cart`, { headers });
  if (res.status === 404) {
    // create
    res = await fetch(`${BASE}/cart`, { method: 'POST', headers });
  }
  if (!res.ok) throw new Error('Failed to ensure cart');
  return res.json(); // { cartId }
}

export async function getCartItems(cartId) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/cart?id=${encodeURIComponent(cartId)}`, { headers });
  if (!res.ok) throw new Error('Failed to load cart items');
  // backend returns [{ product_id, quantity }]
  return res.json();
}

export async function setCartItem(cartId, productId, quantity) {
  const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' };
  const res = await fetch(`${BASE}/cart?id=${encodeURIComponent(cartId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) throw new Error('Failed to update cart');
  return res.json();
}
