/**
 * @migration 20261023000001_avatar_storage_and_governance.sql
 * @description Creates the Supabase Storage 'avatars' bucket with public read CDN distribution
 *              and row-level security policies enforcing identity boundaries.
 * @invariants
 *   - Public read access enables low-latency caching on edge CDN without signed cookie overhead.
 *   - Write and mutate permissions are strictly isolated: users may only mutate objects in their own
 *     subfolder (`avatars/{user_id}/*`), whereas active users with role='admin' have fleet-wide management rights.
 *   - File sizes are capped at 2MB at the storage boundary; client-side processing caps uploads at <100KB WebP.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

-- Provision avatars storage bucket if not already registered
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS: Public Read Access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Read Avatars'
  ) THEN
    CREATE POLICY "Public Read Avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Storage RLS: Upload / Insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Avatar Upload Policy'
  ) THEN
    CREATE POLICY "Avatar Upload Policy"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars' AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
        )
      )
    );
  END IF;
END $$;

-- Storage RLS: Update / Overwrite
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Avatar Update Policy'
  ) THEN
    CREATE POLICY "Avatar Update Policy"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'avatars' AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
        )
      )
    );
  END IF;
END $$;

-- Storage RLS: Delete / Remove
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Avatar Delete Policy'
  ) THEN
    CREATE POLICY "Avatar Delete Policy"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'avatars' AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
        )
      )
    );
  END IF;
END $$;
