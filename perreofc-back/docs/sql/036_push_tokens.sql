-- SQL migration or seed script for the backend database: 036 push tokens.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- Add push notification token column to users table
-- Stores the Expo push token for each user's device
ALTER TABLE users ADD COLUMN push_token varchar;
