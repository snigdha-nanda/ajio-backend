
const supabase = require('../../supabase');

exports.handler = async (event) => {
  const { httpMethod, queryStringParameters, body } = event;

  // 1) GET /products or /products?id={id}
  if (httpMethod === 'GET') {
    const id = queryStringParameters?.id;
    if (id) {
      // fetch single product
      const { data: product, error: fetchErr } = await supabase
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

      if (fetchErr) {
        console.error(fetchErr);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: fetchErr.message }),
        };
      }
      if (!product) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Product not found' }),
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(product),
      };
    } else {
      // fetch all products
      const { data, error } = await supabase
        .from('products')
        .select('id, title, image_path');

      if (error) {
        console.error(error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: error.message }),
        };
      }

      // rename fields for client
      const products = data.map((p) => ({
        id: p.id,
        name: p.title,
        image: p.image_path,
      }));
      return {
        statusCode: 200,
        body: JSON.stringify(products),
      };
    }
  }

  // 2) POST /products  → create new product
  if (httpMethod === 'POST') {
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

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

    // Basic validation
    if (!title || !description || actual_price == null || discounted_price == null) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: title, description, actual_price, discounted_price',
        }),
      };
    }

    const { data: newProduct, error: insertErr } = await supabase
      .from('products')
      .insert([
        {
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
        },
      ])
      .select()
      .single();

    if (insertErr) {
      console.error(insertErr);
      return { statusCode: 500, body: JSON.stringify({ error: insertErr.message }) };
    }
    return {
      statusCode: 201,
      body: JSON.stringify(newProduct),
    };
  }

  if (httpMethod === 'PUT' || httpMethod === 'PATCH') {
    const id = event.queryStringParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing product id in query param ?id=' }),
      };
    }
    const body = JSON.parse(event.body || '{}');
    // Do not allow changing immutable fields
    const { id: _ignore, created_at, ...updates } = body;
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
    if (!data) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Product not found' }) };
    }
    return { statusCode: 200, body: JSON.stringify(data) };
  }

  // 3) anything else
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
};
