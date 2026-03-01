
-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload audio files
CREATE POLICY "Users can upload audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read their own audio files
CREATE POLICY "Users can read own audio files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own audio files
CREATE POLICY "Users can delete own audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access (since bucket is public, for playback)
CREATE POLICY "Public can read audio files"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'audio-files');
