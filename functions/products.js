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

  const { httpMethod, queryStringParameters, body } = event;

  try {
    // GET products (public access)
    if (httpMethod === 'GET') {
      const id = queryStringParameters?.id;
      
      if (id) {
        // Get single product
        const { data: product, error } = await supabase
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
          .maybeSingle();

        if (error) throw error;
        if (!product) {
          return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Product not found' }) };
        }
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(product) };
      } else {
        // Get all products
        const { data, error } = await supabase
          .from('products')
          .select('id, title, image_path, discounted_price, actual_price, short_description');

        if (error) throw error;

        const products = data.map((p) => ({
          id: p.id,
          name: p.title,
          image: p.image_path,
          price: p.discounted_price,
          actualPrice: p.actual_price,
          shortDescription: p.short_description,
        }));
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(products) };
      }
    }

    // Require authentication for write operations
    const user = await requireUser(event);
    if (user.statusCode) return user;

    // POST - Create product
    if (httpMethod === 'POST') {
      const payload = JSON.parse(body || '{}');
      const {
        title,
        description,
        short_description,
        ratings,
        review_count,
        actual_price,
        discounted_price,
        discount_percentage,
        additional_details,
        image_path,
      } = payload;

      if (!title || !description || actual_price == null || discounted_price == null) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing required fields: title, description, actual_price, discounted_price' }),
        };
      }

      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([{
          title,
          description,
          short_description,
          ratings,
          review_count,
          actual_price,
          discounted_price,
          discount_percentage,
          additional_details,
          image_path,
        }])
        .select()
        .single();

      if (error) throw error;
      return { statusCode: 201, headers: corsHeaders, body: JSON.stringify(newProduct) };
    }

    // PUT - Update product
    if (httpMethod === 'PUT') {
      const id = queryStringParameters?.id;
      if (!id) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing product id' }) };
      }

      const updates = JSON.parse(body || '{}');
      const { id: _ignore, created_at, ...validUpdates } = updates;

      const { data, error } = await supabase
        .from('products')
        .update(validUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Product not found' }) };
      }
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(data) };
    }

    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (error) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
  }
};
