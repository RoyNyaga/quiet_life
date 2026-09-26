-- Migration: Add slug_source_locale column to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS slug_source_locale TEXT NOT NULL DEFAULT 'en';
