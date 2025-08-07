
// POST /.netlify/functions/cart
// body: { userId }
// returns: { cartId }
const supabase = require('../../supabase');

exports.handler = async ({ httpMethod, body }) => {
  if (httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(body);
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
};
