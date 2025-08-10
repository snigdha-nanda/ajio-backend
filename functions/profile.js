
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

  const { httpMethod } = event;

  try {
    // Require authentication for all profile operations
    const user = await requireUser(event);
    if (user.statusCode) return user;

    if (httpMethod === 'GET') {
      // Get user profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.uid)
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        // Create profile if doesn't exist (for backward compatibility)
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: user.uid,
            username: user.email?.split('@')[0] || 'User',
            email: user.email,
            joined_date: new Date().toISOString().split('T')[0]
          }])
          .select()
          .single();

        if (createError) throw createError;
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(newProfile) };
      }

      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(profile) };
    }

    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (error) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
  }
};
