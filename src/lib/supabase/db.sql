-- Create a table for public proles
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text
);
-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile for new users.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Create Recordings table
create table recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null, -- 'video' or 'screenshot'
  filename text not null,
  storage_path text not null,
  created_at timestamptz default now()
);

-- RLS for recordings table
alter table recordings enable row level security;

create policy "Users can view their own recordings." on recordings
  for select using (auth.uid() = user_id);

create policy "Users can insert their own recordings." on recordings
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own recordings." on recordings
  for delete using (auth.uid() = user_id);


-- Create Supabase Storage bucket for recordings
-- The bucket is public, but access to files is controlled by policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recordings', 'recordings', true, 52428800, ARRAY['video/webm', 'image/png'])
on conflict (id) do nothing;


-- Storage policies
-- Allow users to view their own files
create policy "Users can view their own recordings in storage"
  on storage.objects for select
  using ( auth.uid() = owner );

-- Allow users to upload files into their own folder
create policy "User can upload to their own folder"
  on storage.objects for insert
  with check ( auth.uid() = owner AND bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Allow users to delete their own files
create policy "User can delete their own files"
  on storage.objects for delete
  using ( auth.uid() = owner );


-- Function to delete old files from storage
create or replace function delete_old_storage_files()
returns trigger
language plpgsql
security definer
as $$
begin
  delete from storage.objects where bucket_id = 'recordings' and owner_id = OLD.user_id and name = OLD.storage_path;
  return old;
end;
$$;

-- Trigger to delete from storage when a recording row is deleted
create trigger before_delete_recording
  before delete on recordings
  for each row
  execute procedure delete_old_storage_files();

-- Function to handle expired recordings (older than 7 days)
-- This can be run on a schedule using Supabase's Cron Jobs feature (e.g., daily).
create or replace function delete_expired_recordings()
returns void
language plpgsql
as $$
begin
  -- This will trigger the before_delete_recording trigger to also delete from storage
  delete from public.recordings where created_at < (now() - interval '7 days');
end;
$$;
