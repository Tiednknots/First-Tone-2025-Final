// track-pageview.js
// Netlify Serverless Function to log visitor traffic anonymously.

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
    
    // Extract country from Netlify Geolocation headers
    const country = event.headers['x-country'] || 'Unknown';

    // Parse user agent
    const userAgent = event.headers['user-agent'] || '';
    let device = 'Desktop';
    if (/Mobi|Android|iPhone/i.test(userAgent)) {
      device = 'Mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      device = 'Tablet';
    }
    
    let browser = 'Other';
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    let referrer = 'Direct';
    if (data.referrer) {
      try {
        referrer = new URL(data.referrer).hostname;
      } catch (e) {
        referrer = 'Direct';
      }
    }

    const payload = {
      path: data.path || '/',
      referrer: referrer,
      country: country,
      browser: browser,
      device: device
    };

    // Clean up internal references
    if (event.headers.host && payload.referrer === event.headers.host) {
      payload.referrer = 'Internal';
    }

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/analytics`, {
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
      throw new Error(`Supabase analytics write failed: ${errText}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error('Analytics log error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
