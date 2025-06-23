-- Add new columns and tables for enhanced features

-- Add dark mode to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT false;

-- Add location fields to media
ALTER TABLE media ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS latitude FLOAT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS longitude FLOAT;

-- Add location fields to notes
ALTER TABLE legacy_notes ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE legacy_notes ADD COLUMN IF NOT EXISTS latitude FLOAT;
ALTER TABLE legacy_notes ADD COLUMN IF NOT EXISTS longitude FLOAT;

-- Add join requests setting to vaults
ALTER TABLE vaults ADD COLUMN IF NOT EXISTS allow_join_requests BOOLEAN DEFAULT false;

-- Create join requests table
CREATE TABLE IF NOT EXISTS join_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(vault_id, user_id)
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create media tags junction table
CREATE TABLE IF NOT EXISTS media_tags (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(media_id, tag_id)
);

-- Create note tags junction table
CREATE TABLE IF NOT EXISTS note_tags (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id TEXT NOT NULL REFERENCES legacy_notes(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(note_id, tag_id)
);

-- Create media mentions table
CREATE TABLE IF NOT EXISTS media_mentions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(media_id, user_id)
);

-- Create note mentions table
CREATE TABLE IF NOT EXISTS note_mentions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id TEXT NOT NULL REFERENCES legacy_notes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(note_id, user_id)
);

-- Create vault activities table
CREATE TABLE IF NOT EXISTS vault_activities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN (
        'MEDIA_UPLOADED', 'MEDIA_DELETED', 'MEDIA_RESTORED', 'VOTE_CAST', 
        'COMMENT_ADDED', 'NOTE_CREATED', 'NOTE_UPDATED', 'NOTE_DELETED',
        'MEMBER_JOINED', 'MEMBER_LEFT', 'MEMBER_REMOVED', 'MEMBER_ROLE_CHANGED',
        'VAULT_CREATED', 'VAULT_UPDATED', 'VAULT_DELETED'
    )),
    details TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add joined_at to vault_members
ALTER TABLE vault_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vault_activities_vault_id ON vault_activities(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_activities_created_at ON vault_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_media_location ON media(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_location ON legacy_notes(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);
