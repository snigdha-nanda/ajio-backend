// GET /.netlify/functions/products
// returns [{ id, name, image }, …]
const supabase = require('../../supabase');

exports.handler = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, image_path');

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
  return { statusCode: 200, body: JSON.stringify(data) };
};
