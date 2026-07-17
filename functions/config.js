// config.js
// Netlify Serverless Function to share Supabase client keys safely with the admin dashboard

exports.handler = async function(event, context) {
  // CORS Preflight headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY environment variables are not defined in Netlify.");
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        supabaseUrl,
        supabaseAnonKey
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
