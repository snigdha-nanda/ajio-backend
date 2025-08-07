// GET /.netlify/functions/products/{id}
// returns { title, description, short_description, ratings, review_count, actual_price, discounted_price, discount_percentage, additional_details, image_path }
const supabase = require('../../supabase');

exports.handler = async ({ pathParameters: { id } }) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      title,
      description,
      short_description,
      ratings,
      review_count,
      actual_price,
      discounted_price,
      discount_percentage,
      additional_details,
      image_path
    `)
    .eq('id', id)
    .single();

  if (error) {
    const code = error.code === 'PGRST116' ? 404 : 500;
    return { statusCode: code, body: JSON.stringify({ error: error.message }) };
  }
  return { statusCode: 200, body: JSON.stringify(data) };
};
