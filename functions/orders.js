
const supabase = require('../supabase');
const { requireUser } = require('./auth');

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  const { httpMethod, body } = event;

  try {
    // Require authentication for all order operations
    const user = await requireUser(event);
    if (user.statusCode) return user;

    if (httpMethod === 'GET') {
      // Get user orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          item_count,
          order_date,
          delivery_date
        `)
        .eq('user_id', user.uid)
        .order('order_date', { ascending: false });

      if (error) throw error;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(orders) };
    }

    if (httpMethod === 'POST') {
      // Create new order
      const payload = JSON.parse(body || '{}');
      const { items, total_amount } = payload;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Items are required' }) };
      }

      if (!total_amount || total_amount <= 0) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Valid total amount is required' }) };
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.uid,
          status: 'processing',
          total_amount: total_amount,
          item_count: items.length
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return { statusCode: 201, headers: corsHeaders, body: JSON.stringify(order) };
    }

    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (error) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
  }
};
