// fetch-from-supabase.js
// Runs during prebuild to query all website text copy, brand settings, and case studies/services from Supabase
// and dynamically writes them into the cms/ folder for Eleventy to compile normally.

const fs = require('fs-extra');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// We can use Service Role Key or Anon Key. Since public read is allowed, Anon Key is sufficient!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Warning: SUPABASE_URL and SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY must be set in your environment variables to fetch dynamic content. Skipping fetch-from-supabase...");
  process.exit(0); // Exit gracefully during local setups without database keys
}

const fetch = require('node-fetch');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: { fetch }
});

function stringifyYAML(obj) {
  let yaml = '';
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) continue;
    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        yaml += `${key}:\n`;
        for (const item of val) {
          yaml += `  - ${item}\n`;
        }
      } else {
        yaml += `${key}:\n`;
        for (const [subKey, subVal] of Object.entries(val)) {
          if (subVal !== null && subVal !== undefined) {
            yaml += `  ${subKey}: ${typeof subVal === 'string' ? JSON.stringify(subVal) : subVal}\n`;
          }
        }
      }
    } else if (typeof val === 'string' && (val.includes('\n') || val.includes(':') || val.includes('[') || val.includes(']'))) {
      if (val.includes('\n')) {
        yaml += `${key}: |-\n  ${val.replace(/\n/g, '\n  ')}\n`;
      } else {
        yaml += `${key}: "${val.replace(/"/g, '\\"')}"\n`;
      }
    } else {
      yaml += `${key}: ${val}\n`;
    }
  }
  return yaml;
}

async function fetchSettings() {
  console.log("Fetching global settings from Supabase...");

  // Fetch texts
  const { data: textsData, error: textsError } = await supabase.from('texts').select('key, current_text');
  if (textsError) throw textsError;
  const texts = {};
  textsData.forEach(row => {
    texts[row.key] = row.current_text;
  });
  await fs.outputJson(path.join(__dirname, '../../cms/_data/texts.json'), texts, { spaces: 2 });
  console.log(`Fetched and wrote ${Object.keys(texts).length} texts.`);

  // Fetch colors
  const { data: colorsData, error: colorsError } = await supabase.from('colors').select('key, hex');
  if (colorsError) throw colorsError;
  const colors = {};
  colorsData.forEach(row => {
    colors[row.key] = row.hex;
  });
  await fs.outputJson(path.join(__dirname, '../../cms/_data/colors.json'), colors, { spaces: 2 });
  console.log(`Fetched and wrote ${Object.keys(colors).length} colors.`);

  // Fetch links
  const { data: linksData, error: linksError } = await supabase.from('links').select('key, url');
  if (linksError) throw linksError;
  const links = {};
  linksData.forEach(row => {
    links[row.key] = row.url;
  });
  await fs.outputJson(path.join(__dirname, '../../cms/_data/links.json'), links, { spaces: 2 });
  console.log(`Fetched and wrote ${Object.keys(links).length} links.`);

  // Fetch images & home gallery
  const { data: imagesData, error: imagesError } = await supabase.from('images').select('key, url, alt');
  if (imagesError) throw imagesError;
  const images = {};
  let gallery = [];
  imagesData.forEach(row => {
    if (row.key === 'home_gallery') {
      try {
        gallery = JSON.parse(row.url);
      } catch (e) {
        gallery = [];
      }
    } else {
      images[row.key] = { url: row.url, alt: row.alt || '' };
    }
  });
  await fs.outputJson(path.join(__dirname, '../../cms/_data/images.json'), images, { spaces: 2 });
  await fs.outputJson(path.join(__dirname, '../../cms/_data/gallery.json'), gallery, { spaces: 2 });
  console.log(`Fetched and wrote ${Object.keys(images).length} images and ${gallery.length} home gallery items.`);
}

async function fetchCaseStudies() {
  console.log("Fetching case-studies from Supabase...");
  const { data, error } = await supabase.from('case_studies').select('*');
  if (error) throw error;

  const dirPath = path.join(__dirname, '../../cms/case-studies');
  await fs.emptyDir(dirPath);

  for (const row of data) {
    const frontmatter = {
      title: row.title,
      slug: row.slug,
      'created-on': row.created_on,
      'updated-on': row.updated_on,
      'published-on': row.published_on,
      f_challenge: row.challenge,
      'f_client-details': row.client_details,
      'f_project-overview': row.project_overview,
      'f_project-description': row.project_description,
      'f_link-to-video': row.link_to_video,
      'f_video-url': row.video_url,
      'f_video-embed-rich-text': row.video_embed_rich_text,
      'f_main-image': row.main_image,
      'f_gallery-images': row.gallery_images,
      'f_mobile-image': row.mobile_image,
      'f_home-video-order': (row.home_video_order !== null && row.home_video_order !== undefined) ? Number(row.home_video_order) : 99,
      'f_work-video-order': (row.work_video_order !== null && row.work_video_order !== undefined) ? Number(row.work_video_order) : 99,
      'f_short-desc': row.short_desc,
      'f_link-to-service': row.link_to_service || [],
      layout: row.layout || '[case-studies].html',
      tags: row.tags || ['case-studies'],
      date: row.publish_date
    };

    const fileContent = `---\n${stringifyYAML(frontmatter)}---\n\n${row.body || ''}\n`;
    await fs.writeFile(path.join(dirPath, `${row.slug}.md`), fileContent, 'utf-8');
    console.log(`Generated case study: ${row.slug}.md`);
  }
}

async function fetchServices() {
  console.log("Fetching services from Supabase...");
  const { data, error } = await supabase.from('services').select('*');
  if (error) throw error;

  const dirPath = path.join(__dirname, '../../cms/services');
  await fs.emptyDir(dirPath);

  for (const row of data) {
    const frontmatter = {
      title: row.title,
      slug: row.slug,
      'created-on': row.created_on,
      'updated-on': row.updated_on,
      'published-on': row.published_on,
      f_image: row.f_image,
      'f_short-description': row.f_short_description,
      layout: row.layout || '[services].html',
      tags: row.tags || ['services'],
      date: row.publish_date
    };

    const fileContent = `---\n${stringifyYAML(frontmatter)}---\n\n${row.body || ''}\n`;
    await fs.writeFile(path.join(dirPath, `${row.slug}.md`), fileContent, 'utf-8');
    console.log(`Generated service: ${row.slug}.md`);
  }
}

async function fetchPartnerships() {
  console.log("Fetching partnerships from Supabase...");
  const { data, error } = await supabase.from('partnerships').select('*');
  if (error) throw error;

  const dirPath = path.join(__dirname, '../../cms/partnerships');
  await fs.emptyDir(dirPath);

  for (const row of data) {
    const frontmatter = {
      title: row.title,
      slug: row.slug,
      'created-on': row.created_on,
      'updated-on': row.updated_on,
      'published-on': row.published_on,
      f_image: row.f_image,
      layout: row.layout || '[partnerships].html',
      tags: row.tags || ['partnerships'],
      date: row.publish_date
    };

    const fileContent = `---\n${stringifyYAML(frontmatter)}---\n`;
    await fs.writeFile(path.join(dirPath, `${row.slug}.md`), fileContent, 'utf-8');
    console.log(`Generated partnership: ${row.slug}.md`);
  }
}

async function run() {
  try {
    await fetchSettings();
    await fetchCaseStudies();
    await fetchServices();
    await fetchPartnerships();
    console.log("Data sync from Supabase completed successfully!");
  } catch (err) {
    console.error("Data sync from Supabase failed:", err);
    process.exit(1);
  }
}

run();
