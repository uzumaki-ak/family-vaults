-- Remove unique constraint on comments table to allow multiple comments per user per media
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_mediaId_authorId_key;
