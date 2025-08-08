
const supabase = require('../supabase');
const { requireUser } = require('./auth');

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Dev-Key, X-User-Id',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  const user = await requireUser(event);
  if (user.statusCode) return user;

  const { httpMethod, queryStringParameters, body } = event;

  try {
    // GET cart items or get cart by user (read-only)
    if (httpMethod === 'GET') {
      const { id: cartId } = queryStringParameters || {};

      if (cartId) {
        // Get cart items
        const { data, error } = await supabase
          .from('cart_items')
          .select('product_id, quantity')
          .eq('cart_id', cartId);
        if (error) throw error;
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(data) };
      } else {
        // Get existing cart for user (no creation)
        const { data: cart, error } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.uid)
          .maybeSingle();
        
        if (error) throw error;
        if (!cart) {
          return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Cart not found' }) };
        }
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ cartId: cart.id }) };
      }
    }

    // POST - Create cart
    if (httpMethod === 'POST') {
      // Check if cart already exists
      const { data: existingCart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.uid)
        .maybeSingle();
      
      if (existingCart) {
        return { statusCode: 409, headers: corsHeaders, body: JSON.stringify({ error: 'Cart already exists', cartId: existingCart.id }) };
      }

      // Create new cart
      const { data: newCart, error } = await supabase
        .from('carts')
        .insert([{ user_id: user.uid }])
        .select('id')
        .single();
        
      if (error) throw error;
      return { statusCode: 201, headers: corsHeaders, body: JSON.stringify({ cartId: newCart.id }) };
    }

    // PUT - Update cart item
    if (httpMethod === 'PUT') {
      const { id: cartId } = queryStringParameters || {};
      if (!cartId) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing cartId' }) };
      }

      const payload = JSON.parse(body || '{}');
      const { productId, quantity } = payload;
      if (!productId || quantity == null) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing productId or quantity' }) };
      }

      const { error } = await supabase
        .from('cart_items')
        .upsert(
          { cart_id: cartId, product_id: productId, quantity },
          { onConflict: ['cart_id', 'product_id'] }
        );
      if (error) throw error;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ productId, quantity }) };
    }

    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (error) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
  }
};
