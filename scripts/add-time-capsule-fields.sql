-- Add time capsule fields to Media table
ALTER TABLE media 
ADD COLUMN unlock_at TIMESTAMP,
ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;

-- Add time capsule fields to LegacyNote table  
ALTER TABLE legacy_notes
ADD COLUMN unlock_at TIMESTAMP,
ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;

-- Update existing records to have is_locked = FALSE
UPDATE media SET is_locked = FALSE WHERE is_locked IS NULL;
UPDATE legacy_notes SET is_locked = FALSE WHERE is_locked IS NULL;

-- Create index for better query performance
CREATE INDEX idx_media_unlock_at ON media(unlock_at);
CREATE INDEX idx_media_is_locked ON media(is_locked);
CREATE INDEX idx_legacy_notes_unlock_at ON legacy_notes(unlock_at);
CREATE INDEX idx_legacy_notes_is_locked ON legacy_notes(is_locked);
