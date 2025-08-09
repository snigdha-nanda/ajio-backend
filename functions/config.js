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
    // GET operations are public for config values
    if (httpMethod === 'GET') {
      const { key } = queryStringParameters || {};
      
      if (key) {
        const { data, error } = await supabase
          .from('config')
          .select('value')
          .eq('key', key)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Not found' }) };
        }
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ key, value: data.value }) };
      } else {
        const { data, error } = await supabase
          .from('config')
          .select('key, value');

        if (error) throw error;
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(data) };
      }
    }

    // Require authentication for write operations
    const user = await requireUser(event);
    if (user.statusCode) return user;

    const payload = JSON.parse(body || '{}');
    const { key, value } = payload;
    
    if (!key || value == null) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing key or value' }) };
    }

    // POST - Create new config (fails if exists)
    if (httpMethod === 'POST') {
      const { data, error } = await supabase
        .from('config')
        .insert([{ key, value }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // unique constraint violation
          return { statusCode: 409, headers: corsHeaders, body: JSON.stringify({ error: 'Config key already exists' }) };
        }
        throw error;
      }
      return { statusCode: 201, headers: corsHeaders, body: JSON.stringify(data) };
    }

    // PUT - Update existing config
    if (httpMethod === 'PUT') {
      const { data, error } = await supabase
        .from('config')
        .update({ value })
        .eq('key', key)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Config key not found' }) };
      }
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(data) };
    }

    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (error) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
  }
};
