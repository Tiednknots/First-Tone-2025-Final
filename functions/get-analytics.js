// get-analytics.js
// Netlify Serverless Function to aggregate analytics events securely.

const fetch = require('node-fetch'); // Standard node fetch resolution

async function checkAdmin(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  
  // Verify token with Supabase Auth API
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString();

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/analytics?created_at=gte.${dateStr}`, {
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Supabase analytics query failed: ${errText}`);
    }

    const logs = await response.json();

    const dailyStats = {};
    const pageviews = {};
    const referrers = {};
    const countries = {};
    const devices = {};

    logs.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyStats[date] = (dailyStats[date] || 0) + 1;
      pageviews[log.path] = (pageviews[log.path] || 0) + 1;
      referrers[log.referrer || 'Direct'] = (referrers[log.referrer || 'Direct'] || 0) + 1;
      countries[log.country || 'Unknown'] = (countries[log.country || 'Unknown'] || 0) + 1;
      devices[log.device || 'Desktop'] = (devices[log.device || 'Desktop'] || 0) + 1;
    });

    const sortAndFormatObj = (obj) => {
      return Object.entries(obj)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    const payload = {
      totalViews: logs.length,
      daily: Object.entries(dailyStats).map(([date, count]) => ({ date, count })),
      pages: sortAndFormatObj(pageviews).slice(0, 10),
      referrers: sortAndFormatObj(referrers).slice(0, 10),
      countries: sortAndFormatObj(countries).slice(0, 10),
      devices: sortAndFormatObj(devices)
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(payload)
    };
  } catch (err) {
    console.error('Analytics aggregation error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
