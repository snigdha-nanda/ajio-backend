// GET /.netlify/functions/cart/user/{userId}
// returns: { cartId }
const supabase = require('../../../supabase');

exports.handler = async ({ pathParameters: { userId } }) => {
  const { data, error } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (error) {
    const code = error.code === 'PGRST116' ? 404 : 500;
    return { statusCode: code, body: JSON.stringify({ error: error.message }) };
  }
  return { statusCode: 200, body: JSON.stringify({ cartId: data.id }) };
};
