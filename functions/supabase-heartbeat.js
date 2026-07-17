// supabase-heartbeat.js
// Netlify Scheduled Serverless Function to keep the Supabase database instance 
// active and prevent it from pausing due to inactivity in free tier.

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Heartbeat skipped: SUPABASE_URL or SUPABASE_ANON_KEY is not defined.");
    return { statusCode: 200 };
  }

  try {
    // Perform a lightweight query on the texts table to keep the DB connection active
    const response = await fetch(`${supabaseUrl}/rest/v1/texts?select=key&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log("Supabase heartbeat ping successful. DB remains active.");
    } else {
      const errText = await response.text();
      console.warn("Supabase heartbeat ping warning:", errText);
    }
  } catch (err) {
    console.error("Supabase heartbeat ping error:", err.message);
  }

  return { statusCode: 200 };
};
