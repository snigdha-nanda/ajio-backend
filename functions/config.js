
const supabase = require('../supabase');

exports.handler = async (event) => {
  const { httpMethod, queryStringParameters, body } = event;

  // 1) GET all or one
  if (httpMethod === 'GET') {
    const { key } = queryStringParameters || {};
    if (key) {
      // fetch single entry
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      }
      if (!data) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ key, value: data.value }),
      };
    } else {
      // fetch all entries
      const { data, error } = await supabase
        .from('config')
        .select('key, value');

      if (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    }
  }

  // 2) POST or PUT: create or update an entry
  if (httpMethod === 'POST' || httpMethod === 'PUT') {
    let payload;
    try {
      payload = JSON.parse(body || '{}');
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
    const { key, value } = payload;
    if (!key || value == null) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing key or value' }),
      };
    }

    // upsert (insert or update)
    const { data, error } = await supabase
      .from('config')
      .upsert([{ key, value }], { onConflict: ['key'] })
      .select()
      .single();

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
    return {
      statusCode: httpMethod === 'POST' ? 201 : 200,
      body: JSON.stringify(data),
    };
  }

  // 3) Method not allowed
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
};
