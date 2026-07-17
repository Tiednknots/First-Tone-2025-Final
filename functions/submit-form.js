// submit-form.js
// Netlify Serverless Function to handle form inputs on the client site and save them to Supabase.

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    
    const payload = {
      name: data.name || '',
      surname: data.surname || '',
      email: data.email || '',
      company: data.company || '',
      message: data.message || '',
      form_type: data.form_type || 'contact'
    };

    if (!payload.email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email address is required.' })
      };
    }

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Supabase insert failed: ${errText}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error('Submit form error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
