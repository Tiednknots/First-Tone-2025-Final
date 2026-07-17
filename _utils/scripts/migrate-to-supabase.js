// migrate-to-supabase.js
// A Node.js utility script to parse local Markdown/JSON CMS data and push it into Supabase.

const fs = require('fs-extra');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const matter = require('gray-matter');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment variables or .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateTexts() {
  console.log("Migrating texts.json...");
  const textsPath = path.join(__dirname, '../../cms/_data/texts.json');
  if (await fs.pathExists(textsPath)) {
    const texts = await fs.readJson(textsPath);
    const dataToInsert = Object.entries(texts).map(([key, val]) => ({
      key,
      original_text: val,
      current_text: val,
      category: 'General'
    }));

    if (dataToInsert.length > 0) {
      const { error } = await supabase.from('texts').upsert(dataToInsert);
      if (error) console.error("Error migrating texts:", error.message);
      else console.log(`Migrated ${dataToInsert.length} texts.`);
    }
  }
}

async function migrateColors() {
  console.log("Migrating colors.json...");
  const colorsPath = path.join(__dirname, '../../cms/_data/colors.json');
  if (await fs.pathExists(colorsPath)) {
    const colors = await fs.readJson(colorsPath);
    const dataToInsert = Object.entries(colors).map(([key, val]) => ({
      key,
      hex: val
    }));

    if (dataToInsert.length > 0) {
      const { error } = await supabase.from('colors').upsert(dataToInsert);
      if (error) console.error("Error migrating colors:", error.message);
      else console.log(`Migrated ${dataToInsert.length} colors.`);
    } else {
      console.log("No colors found to migrate.");
    }
  }
}

async function migrateLinks() {
  console.log("Migrating links.json...");
  const linksPath = path.join(__dirname, '../../cms/_data/links.json');
  if (await fs.pathExists(linksPath)) {
    const links = await fs.readJson(linksPath);
    const dataToInsert = Object.entries(links).map(([key, val]) => ({
      key,
      url: val,
      label: key
    }));

    if (dataToInsert.length > 0) {
      const { error } = await supabase.from('links').upsert(dataToInsert);
      if (error) console.error("Error migrating links:", error.message);
      else console.log(`Migrated ${dataToInsert.length} links.`);
    }
  }
}

async function migrateImages() {
  console.log("Migrating images.json...");
  const imagesPath = path.join(__dirname, '../../cms/_data/images.json');
  if (await fs.pathExists(imagesPath)) {
    const images = await fs.readJson(imagesPath);
    const dataToInsert = Object.entries(images).map(([key, val]) => ({
      key,
      url: val.url || '',
      alt: val.alt || ''
    }));

    if (dataToInsert.length > 0) {
      const { error } = await supabase.from('images').upsert(dataToInsert);
      if (error) console.error("Error migrating images:", error.message);
      else console.log(`Migrated ${dataToInsert.length} images.`);
    }
  }
}

async function migrateCaseStudies() {
  console.log("Migrating case-studies...");
  const dirPath = path.join(__dirname, '../../cms/case-studies');
  if (await fs.pathExists(dirPath)) {
    const files = await fs.readdir(dirPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    for (const file of mdFiles) {
      const filePath = path.join(dirPath, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      const record = {
        slug: data.slug || path.basename(file, '.md'),
        title: data.title || 'Untitled',
        created_on: data['created-on'] ? new Date(data['created-on']).toISOString() : null,
        updated_on: data['updated-on'] ? new Date(data['updated-on']).toISOString() : null,
        published_on: data['published-on'] ? new Date(data['published-on']).toISOString() : null,
        body: content || '',
        client_details: data.f_client_details || data['f_client-details'] || null,
        challenge: data.f_challenge || null,
        short_desc: data.f_short_desc || data['f_short-desc'] || null,
        project_overview: data.f_project_overview || data['f_project-overview'] || null,
        project_description: data.f_project_description || data['f_project-description'] || null,
        link_to_video: data.f_link_to_video || data['f_link-to-video'] || null,
        video_url: data.f_video_url || data['f_video-url'] || null,
        video_embed_rich_text: data.f_video_embed_rich_text || data['f_video-embed-rich-text'] || null,
        main_image: data.f_main_image || data['f_main-image'] || null,
        gallery_images: data.f_gallery_images || data['f_gallery-images'] || null,
        mobile_image: data.f_mobile_image || data['f_mobile-image'] || null,
        home_video_order: data.f_home_video_order !== undefined ? Number(data.f_home_video_order) : (data['f_home-video-order'] !== undefined ? Number(data['f_home-video-order']) : null),
        tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' ? [data.tags] : ['case-studies']),
        layout: data.layout || '[case-studies].html',
        publish_date: data.date ? new Date(data.date).toISOString() : null
      };

      const { error } = await supabase.from('case_studies').upsert(record);
      if (error) {
        console.error(`Error migrating case study ${file}:`, error.message);
      } else {
        console.log(`Migrated case study: ${record.title}`);
      }
    }
  }
}

async function migrateServices() {
  console.log("Migrating services...");
  const dirPath = path.join(__dirname, '../../cms/services');
  if (await fs.pathExists(dirPath)) {
    const files = await fs.readdir(dirPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    for (const file of mdFiles) {
      const filePath = path.join(dirPath, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      const record = {
        slug: data.slug || path.basename(file, '.md'),
        title: data.title || 'Untitled',
        created_on: data['created-on'] ? new Date(data['created-on']).toISOString() : null,
        updated_on: data['updated-on'] ? new Date(data['updated-on']).toISOString() : null,
        published_on: data['published-on'] ? new Date(data['published-on']).toISOString() : null,
        body: content || '',
        f_image: data.f_image || null,
        f_short_description: data.f_short_description || data['f_short-description'] || null,
        tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' ? [data.tags] : ['services']),
        layout: data.layout || '[services].html',
        publish_date: data.date ? new Date(data.date).toISOString() : null
      };

      const { error } = await supabase.from('services').upsert(record);
      if (error) {
        console.error(`Error migrating service ${file}:`, error.message);
      } else {
        console.log(`Migrated service: ${record.title}`);
      }
    }
  }
}

async function migratePartnerships() {
  console.log("Migrating partnerships...");
  const dirPath = path.join(__dirname, '../../cms/partnerships');
  if (await fs.pathExists(dirPath)) {
    const files = await fs.readdir(dirPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    for (const file of mdFiles) {
      const filePath = path.join(dirPath, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const { data } = matter(fileContent);

      const record = {
        slug: data.slug || path.basename(file, '.md'),
        title: data.title || 'Untitled',
        created_on: data['created-on'] ? new Date(data['created-on']).toISOString() : null,
        updated_on: data['updated-on'] ? new Date(data['updated-on']).toISOString() : null,
        published_on: data['published-on'] ? new Date(data['published-on']).toISOString() : null,
        f_image: data.f_image || null,
        tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' ? [data.tags] : ['partnerships']),
        layout: data.layout || '[partnerships].html',
        publish_date: data.date ? new Date(data.date).toISOString() : null
      };

      const { error } = await supabase.from('partnerships').upsert(record);
      if (error) {
        console.error(`Error migrating partnership ${file}:`, error.message);
      } else {
        console.log(`Migrated partnership: ${record.title}`);
      }
    }
  }
}

async function run() {
  try {
    await migrateTexts();
    await migrateColors();
    await migrateLinks();
    await migrateImages();
    await migrateCaseStudies();
    await migrateServices();
    await migratePartnerships();
    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

run();
