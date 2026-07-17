// get-messages.js
// Netlify Serverless Function to securely query, mark as read, or delete inbox contact form submissions.

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  if (event.httpMethod === 'GET') {
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/messages?order=created_at.desc`, {
        method: 'GET',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const { action, id } = JSON.parse(event.body || '{}');
      
      if (action === 'read') {
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/messages?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_read: true })
        });
        
        if (!response.ok) {
          throw new Error(await response.text());
        }
      } else if (action === 'delete') {
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/messages?id=eq.${id}`, {
          method: 'DELETE',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(await response.text());
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
