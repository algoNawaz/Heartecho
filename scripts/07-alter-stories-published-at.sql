-- Remove the default value and allow NULLs for published_at
ALTER TABLE stories ALTER COLUMN published_at DROP DEFAULT;
ALTER TABLE stories ALTER COLUMN published_at DROP NOT NULL;

-- Optional: If you have existing draft stories with a published_at value, you might want to set them to NULL
-- UPDATE stories SET published_at = NULL WHERE status = 'draft' AND published_at IS NOT NULL;
