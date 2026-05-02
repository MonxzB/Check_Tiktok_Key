-- ============================================================
-- Phase 11 Migration: Multi-language Support
-- Run in Supabase SQL Editor
-- ============================================================

-- Add content_language to workspaces
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS content_language TEXT DEFAULT 'ja'
  CHECK (content_language IN ('ja', 'ko', 'en', 'vi'));

-- Add content_language to keywords
ALTER TABLE keywords
  ADD COLUMN IF NOT EXISTS content_language TEXT DEFAULT 'ja'
  CHECK (content_language IN ('ja', 'ko', 'en', 'vi'));

-- Backfill existing data
UPDATE workspaces SET content_language = 'ja' WHERE content_language IS NULL;
UPDATE keywords    SET content_language = 'ja' WHERE content_language IS NULL;
