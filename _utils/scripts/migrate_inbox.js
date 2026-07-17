// migrate_inbox.js
// Reads the historical Webflow CSV messages and imports them into Supabase,
// correctly classifying submissions as 'contact' or 'newsletter'.

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 1. Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY in your .env file first!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Resolve CSV file path
// The CSV is located in the parent folder "Older messages/wf-form-Newsletter-First-Tone-Production.csv"
const csvPath = path.resolve(__dirname, '../../../Older messages/wf-form-Newsletter-First-Tone-Production.csv');

if (!fs.existsSync(csvPath)) {
  console.error(`Error: Historical CSV file not found at path:\n${csvPath}\n\nPlease check the file location.`);
  process.exit(1);
}

// 3. Robust CSV Parser supporting multiline quoted messages
function parseCSV(content) {
  const rows = [];
  let row = [];
  let col = '';
  let insideQuote = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i+1];
    
    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        col += '"'; // escaped quote
        i++;
      } else {
        insideQuote = !insideQuote; // toggle quote state
      }
    } else if (char === ',' && !insideQuote) {
      row.push(col);
      col = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(col);
      if (row.some(x => x.trim() !== '')) {
        rows.push(row);
      }
      row = [];
      col = '';
    } else {
      col += char;
    }
  }
  if (col !== '' || row.length > 0) {
    row.push(col);
    rows.push(row);
  }
  return rows;
}

async function runMigration() {
  console.log("Reading CSV messages list...");
  const rawCSV = fs.readFileSync(csvPath, 'utf8');
  
  const parsedRows = parseCSV(rawCSV);
  if (parsedRows.length <= 1) {
    console.log("No messages to import (CSV is empty).");
    return;
  }
  
  // Extract and strip headers: "name-2", "email-2", "field-2", "ip", "user_agent", "referrer", "created_at"
  const headers = parsedRows[0];
  const dataRows = parsedRows.slice(1);
  
  console.log(`Processing ${dataRows.length} message records...`);
  
  const payloads = dataRows.map((row, idx) => {
    const name = (row[0] || '').trim();
    const email = (row[1] || '').trim();
    const message = (row[2] || '').trim();
    const created_at = (row[6] || '').trim();
    
    if (!email) {
      // Skip incomplete records
      return null;
    }
    
    // Classify form type based on whether a message was typed
    const form_type = message.length > 0 ? 'contact' : 'newsletter';
    
    return {
      name: name,
      surname: '',
      email: email,
      company: '',
      message: message,
      form_type: form_type,
      is_read: true, // mark old historical messages as read
      created_at: created_at ? new Date(created_at).toISOString() : new Date().toISOString()
    };
  }).filter(Boolean);

  if (payloads.length === 0) {
    console.log("No valid records found to import.");
    return;
  }

  console.log(`Uploading ${payloads.length} messages to Supabase 'messages' table...`);
  
  const { error } = await supabase.from('messages').insert(payloads);
  
  if (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
  
  console.log("Import completed successfully! Historical inbox messages are now live.");
}

runMigration();
