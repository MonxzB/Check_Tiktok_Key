-- 011_master_password.sql — Master Password table for zero-knowledge vault
-- Stores a PBKDF2-derived canary verifier (NOT the plaintext password).
-- The canary_ciphertext is "YTLF_VAULT_CANARY_V1" encrypted with the derived
-- AES-256-GCM key. Decryption success == correct master password.

CREATE TABLE IF NOT EXISTS user_master_password (
  user_id          UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- salt for PBKDF2 key derivation (base64, 32 bytes random)
  salt             TEXT    NOT NULL,
  -- canary encrypted with AES-256-GCM derived from master password
  canary_ciphertext TEXT   NOT NULL,
  canary_iv         TEXT   NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_master_password ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_password_owner_all" ON user_master_password
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_master_password_updated_at
  BEFORE UPDATE ON user_master_password
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
