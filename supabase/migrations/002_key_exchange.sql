-- Migration 002: Key exchange support
-- Adds sender_id to conversation_keys (needed to know whose shared key to use for decryption)
-- Adds key_version for algorithm agility
-- Adds format versioning to users.public_key

-- Add sender_id to conversation_keys (who created/encrypted this key entry)
ALTER TABLE conversation_keys
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS key_version INTEGER NOT NULL DEFAULT 1;

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_conversation_keys_sender_id ON conversation_keys(sender_id);

-- Add key_algorithm field to users for future algorithm agility
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS key_algorithm TEXT NOT NULL DEFAULT 'x25519';

-- Update RLS: users can update their own key
CREATE POLICY IF NOT EXISTS "Users can update own public key" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- conversation_keys: allow update for re-keying
CREATE POLICY IF NOT EXISTS "Users can update their own conversation keys" ON conversation_keys
  FOR UPDATE USING (user_id = auth.uid());

-- Drop old insert policy and recreate with sender_id support
DROP POLICY IF EXISTS "Users can create their own conversation keys" ON conversation_keys;

CREATE POLICY "Users can create their own conversation keys" ON conversation_keys
  FOR INSERT WITH CHECK (user_id = auth.uid() OR sender_id = auth.uid());
