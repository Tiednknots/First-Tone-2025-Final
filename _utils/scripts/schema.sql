-- schema.sql
-- Run this script in the Supabase SQL Editor to set up all tables and Row Level Security (RLS) policies.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Texts Table (Global copy translations)
CREATE TABLE IF NOT EXISTS public.texts (
    key TEXT PRIMARY KEY,
    original_text TEXT,
    current_text TEXT,
    category TEXT
);

-- 2. Colors Table (Brand settings)
CREATE TABLE IF NOT EXISTS public.colors (
    key TEXT PRIMARY KEY,
    hex TEXT NOT NULL
);

-- 3. Links Table (Navigation/External URLs)
CREATE TABLE IF NOT EXISTS public.links (
    key TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    label TEXT
);

-- 3b. Images Table (Global images/logos)
CREATE TABLE IF NOT EXISTS public.images (
    key TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    alt TEXT
);

-- 4. Case Studies Table (Projects)
CREATE TABLE IF NOT EXISTS public.case_studies (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_on TIMESTAMPTZ,
    updated_on TIMESTAMPTZ,
    published_on TIMESTAMPTZ,
    body TEXT, -- Markdown or HTML embed code
    client_details TEXT,
    challenge TEXT,
    short_desc TEXT,
    project_overview TEXT,
    project_description TEXT,
    link_to_video TEXT,
    video_url TEXT,
    video_embed_rich_text TEXT,
    main_image JSONB, -- { "url": string, "alt": string }
    gallery_images JSONB, -- [ { "url": string, "alt": string } ]
    mobile_image JSONB, -- { "url": string, "alt": string }
    home_video_order INTEGER,
    link_to_service TEXT[], -- Relation to services (array of markdown paths)
    tags TEXT[] DEFAULT ARRAY['case-studies']::TEXT[],
    layout TEXT DEFAULT '[case-studies].html',
    publish_date TIMESTAMPTZ
);

-- 5. Services Table
CREATE TABLE IF NOT EXISTS public.services (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_on TIMESTAMPTZ,
    updated_on TIMESTAMPTZ,
    published_on TIMESTAMPTZ,
    body TEXT,
    f_image JSONB, -- { "url": string, "alt": string }
    f_short_description TEXT,
    tags TEXT[] DEFAULT ARRAY['services']::TEXT[],
    layout TEXT DEFAULT '[services].html',
    publish_date TIMESTAMPTZ
);

-- 6. Partnerships Table
CREATE TABLE IF NOT EXISTS public.partnerships (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_on TIMESTAMPTZ,
    updated_on TIMESTAMPTZ,
    published_on TIMESTAMPTZ,
    f_image JSONB, -- { "url": string, "alt": string }
    tags TEXT[] DEFAULT ARRAY['partnerships']::TEXT[],
    layout TEXT DEFAULT '[partnerships].html',
    publish_date TIMESTAMPTZ
);

-- 7. Messages Table (Inbox)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT,
    surname TEXT,
    email TEXT NOT NULL,
    company TEXT,
    message TEXT,
    form_type TEXT DEFAULT 'contact', -- 'contact' or 'newsletter'
    is_read BOOLEAN DEFAULT false
);

-- 8. Analytics Table (Traffic metrics)
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    path TEXT NOT NULL,
    referrer TEXT,
    country TEXT,
    browser TEXT,
    device TEXT
);

-- Enable RLS for all tables
ALTER TABLE public.texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Create Policies

-- 1. Read access for everyone (Public)
CREATE POLICY "Allow public read on texts" ON public.texts FOR SELECT USING (true);
CREATE POLICY "Allow public read on colors" ON public.colors FOR SELECT USING (true);
CREATE POLICY "Allow public read on links" ON public.links FOR SELECT USING (true);
CREATE POLICY "Allow public read on images" ON public.images FOR SELECT USING (true);
CREATE POLICY "Allow public read on case_studies" ON public.case_studies FOR SELECT USING (true);
CREATE POLICY "Allow public read on services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow public read on partnerships" ON public.partnerships FOR SELECT USING (true);

-- 2. Insert access for everyone (Public submissions/logs)
CREATE POLICY "Allow public insert on messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on analytics" ON public.analytics FOR INSERT WITH CHECK (true);

-- 3. Full access for authenticated administrators (using Supabase Auth)
CREATE POLICY "Allow admin all actions on texts" ON public.texts 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admin all actions on colors" ON public.colors 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admin all actions on links" ON public.links 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admin all actions on images" ON public.images 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admin all actions on case_studies" ON public.case_studies 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admin all actions on services" ON public.services 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admin all actions on partnerships" ON public.partnerships 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admin all actions on messages" ON public.messages 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admin all actions on analytics" ON public.analytics 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');
