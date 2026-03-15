-- schema.sql
-- Paste this into your Supabase SQL Editor to initialize the database

-- Enable Row Level Security
-- Allow users to only access their own data

-- 1. USERS TABLE
-- (If you are using Supabase Auth, you can link this to auth.users, or just use auth.users directly. 
-- We'll create a public.profiles table that mirrors auth.users for easier querying)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. FOLDERS TABLE
CREATE TABLE public.folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own folders" ON public.folders FOR ALL USING (auth.uid() = user_id);

-- 3. NOTES TABLE
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  original_content TEXT DEFAULT '',
  ai_enhanced_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- Function to auto-update updated_at on notes
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_note_updated
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 4. FILES TABLE
CREATE TABLE public.files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  raw_text TEXT, -- Extracted text
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
-- For files, we verify ownership through the linked note
CREATE POLICY "Users can manage files for own notes" ON public.files 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.notes WHERE notes.id = files.note_id AND notes.user_id = auth.uid())
  );

-- 5. STORAGE BUCKET
-- Run this to create the bucket (or create it manually via UI)
INSERT INTO storage.buckets (id, name, public) VALUES ('notes-files', 'notes-files', false) ON CONFLICT DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload files to their folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'notes-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'notes-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view their files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'notes-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'notes-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- USER REQUESTED ALTERATIONS
alter table notes add column if not exists original_content text;
alter table notes add column if not exists ai_enhanced_content text;
alter table notes add column if not exists title text;
alter table notes add column if not exists user_id uuid references auth.users(id);
alter table notes add column if not exists created_at timestamp with time zone default now();
