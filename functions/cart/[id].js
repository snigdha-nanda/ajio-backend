// GET /.netlify/functions/cart/{id}
//   → [{ product_id, quantity }, …]
// PUT /.netlify/functions/cart/{id}
//   body: { productId, quantity }
//   → { productId, quantity }
const supabase = require('../../supabase');

exports.handler = async ({ httpMethod, pathParameters: { id }, body }) => {
  // 1) Ensure cart exists
  const { data: cart, error: cartErr } = await supabase
    .from('carts')
    .select('id')
    .eq('id', id)
    .single();

  if (cartErr) {
    const code = cartErr.code === 'PGRST116' ? 404 : 500;
    return { statusCode: code, body: JSON.stringify({ error: cartErr.message }) };
  }

  // 2) GET items
  if (httpMethod === 'GET') {
    const { data, error } = await supabase
      .from('cart_items')
      .select('product_id, quantity')
      .eq('cart_id', id);
    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
    return { statusCode: 200, body: JSON.stringify(data) };
  }

  // 3) PUT update/add item
  if (httpMethod === 'PUT') {
    let upd;
    try {
      upd = JSON.parse(body);
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
    const { productId, quantity } = upd;
    if (!productId || quantity == null) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing productId or quantity' }) };
    }

    // Upsert item
    const { error } = await supabase
      .from('cart_items')
      .upsert(
        { cart_id: id, product_id: productId, quantity },
        { onConflict: ['cart_id', 'product_id'] }
      );
    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
    return { statusCode: 200, body: JSON.stringify({ productId, quantity }) };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
