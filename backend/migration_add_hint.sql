-- Migration: Add hint column to flashcards table
-- Run this SQL script if you have an existing database with flashcards

-- Add hint column to flashcards table (nullable for backwards compatibility)
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS hint VARCHAR;

-- Optional: Add a comment to the column
COMMENT ON COLUMN flashcards.hint IS 'Helpful hint for the flashcard question';
