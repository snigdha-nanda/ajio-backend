
const supabase = require('../supabase');

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

  // 2) GET cart items OR lookup cart by user
  if (httpMethod === 'GET') {
    const { id: cartId, userId } = queryStringParameters || {};

    // 2a) Get items by cartId
    if (cartId) {
      const { data, error } = await supabase
        .from('cart_items')
        .select('product_id, quantity')
        .eq('cart_id', cartId);
      if (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      }
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    // 2b) Lookup cartId by userId
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

    return { statusCode: 400, body: JSON.stringify({ error: 'Provide ?id=<cartId> or ?userId=<userId>' }) };
  }

  // 3) Add or update a single cart item
  if (httpMethod === 'PUT') {
    const { id: cartId } = queryStringParameters || {};
    if (!cartId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing cartId (use ?id=)' }) };
    }

    let payload;
    try {
      payload = JSON.parse(body || '{}');
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
    const { productId, quantity } = payload;
    if (!productId || quantity == null) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing productId or quantity' }) };
    }

    const { error } = await supabase
      .from('cart_items')
      .upsert(
        { cart_id: cartId, product_id: productId, quantity },
        { onConflict: ['cart_id', 'product_id'] }
      );
    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
    return { statusCode: 200, body: JSON.stringify({ productId, quantity }) };
  }

  // 4) Method Not Allowed
  return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
