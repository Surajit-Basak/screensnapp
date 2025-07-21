-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    shareable_link TEXT
);

-- Enable RLS for recordings table
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Policies for recordings table
DROP POLICY IF EXISTS "Users can view their own recordings" ON recordings;
CREATE POLICY "Users can view their own recordings" ON recordings
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recordings" ON recordings;
CREATE POLICY "Users can insert their own recordings" ON recordings
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recordings" ON recordings;
CREATE POLICY "Users can delete their own recordings" ON recordings
FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for recordings
-- Note: This part needs to be run with care. Storage bucket creation doesn't have an 'IF NOT EXISTS' in Supabase's SQL API.
-- You can run this from the Supabase Dashboard under Storage > Create a new bucket.
-- Or run the below insert statement once. If it fails, the bucket likely already exists.
-- Make sure the bucket name is 'recordings' and it's public or has appropriate policies.

-- The following is an example and might need to be run manually or adapted.
-- It's generally safer to create the bucket through the Supabase UI.
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('recordings', 'recordings', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Users can manage their own recordings" ON storage.objects;
CREATE POLICY "Users can manage their own recordings" ON storage.objects
FOR ALL
USING (bucket_id = 'recordings' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'recordings' AND auth.uid() = owner);
