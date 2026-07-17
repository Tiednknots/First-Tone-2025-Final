// rebuild.js
// Netlify Serverless Function to trigger a site rebuild via Netlify Build Hook URL.
// Authenticates user JWT using Supabase Auth.

const fetch = require('node-fetch');

async function checkAdmin(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    method: 'GET',
    headers: {
      'apikey': process.env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.ok;
}

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  const isAdmin = await checkAdmin(authHeader);
  
  if (!isAdmin) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized user credentials' })
    };
  }

  try {
    const buildHookUrl = process.env.NETLIFY_BUILD_HOOK_URL;
    if (!buildHookUrl) {
      throw new Error("NETLIFY_BUILD_HOOK_URL environment variable is not defined in Netlify settings.");
    }

    const response = await fetch(buildHookUrl, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error("Failed to trigger Netlify build hook");
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Build triggered successfully!' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
