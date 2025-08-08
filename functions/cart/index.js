
const supabase = require('../../supabase');

exports.handler = async (event) => {
  const { httpMethod, queryStringParameters, body } = event;

  // 1) Create a new cart
  if (httpMethod === 'POST') {
    let payload;
    try {
      payload = JSON.parse(body || '{}');
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
    const { userId } = payload;
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing userId' }) };
    }
    const { data, error } = await supabase
      .from('carts')
      .insert([{ user_id: userId }])
      .select('id')
      .single();
    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
    return { statusCode: 201, body: JSON.stringify({ cartId: data.id }) };
  }

  // 2) Read: either get items for a cart, or lookup cart by user
  if (httpMethod === 'GET') {
    const { id, userId } = queryStringParameters || {};

    // 2a) GET /cart?id={cartId} → list of { product_id, quantity }
    if (id) {
      const { data, error } = await supabase
        .from('cart_items')
        .select('product_id, quantity')
        .eq('cart_id', id);
      if (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      }
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    // 2b) GET /cart?userId={userId} → { cartId }
    if (userId) {
      const { data, error } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      }
      if (!data) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Cart not found for user' }) };
      }
      return { statusCode: 200, body: JSON.stringify({ cartId: data.id }) };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing id or userId query parameter' }),
    };
  }

  // 3) Update/Add a cart item
  if (httpMethod === 'PUT') {
    const { id } = queryStringParameters || {};
    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing cartId (id) query parameter' }) };
    }

    let upd;
    try {
      upd = JSON.parse(body || '{}');
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
    const { productId, quantity } = upd;
    if (!productId || quantity == null) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing productId or quantity' }) };
    }

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

  // 4) Method not allowed
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method Not Allowed' })
  };
};
