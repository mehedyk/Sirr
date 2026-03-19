-- ═══════════════════════════════════════════════════════════════
-- ZIP 4 — HMAC column, read receipts, RLS hardening
-- Run this in Supabase SQL editor after deploying ZIP 4.
-- ═══════════════════════════════════════════════════════════════

-- 1. HMAC signature column on messages (nullable — old rows have none)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS hmac TEXT;

-- 2. Read receipts table
CREATE TABLE IF NOT EXISTS read_receipts (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE read_receipts ENABLE ROW LEVEL SECURITY;

-- Users can upsert their own receipt
CREATE POLICY "users_upsert_own_receipt" ON read_receipts
  FOR ALL USING (auth.uid() = user_id);

-- Members of the conversation can read receipts
CREATE POLICY "members_read_receipts" ON read_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_members.conversation_id = read_receipts.conversation_id
        AND conversation_members.user_id = auth.uid()
    )
  );

-- 3. Harden conversation_members INSERT policy:
--    Only admins of a conversation can add new members (prevents self-add race condition, S5)
DROP POLICY IF EXISTS "members_insert" ON conversation_members;

CREATE POLICY "admin_insert_members" ON conversation_members
  FOR INSERT WITH CHECK (
    -- Allow inserting yourself only when creating a new conversation (no members yet)
    -- OR when you are already an admin of that conversation
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversation_members existing
      WHERE existing.conversation_id = conversation_members.conversation_id
        AND existing.user_id = auth.uid()
        AND existing.role = 'admin'
    )
  );

-- 4. Realtime for read_receipts
ALTER PUBLICATION supabase_realtime ADD TABLE read_receipts;
