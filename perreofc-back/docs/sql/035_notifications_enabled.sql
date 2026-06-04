-- SQL migration or seed script for the backend database: 035 notifications enabled.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- Add notifications_enabled flag to users table
-- Replaces the complex notification_preferences table for in-app notifications
-- Default true so existing users keep receiving notifications
ALTER TABLE users ADD COLUMN notifications_enabled boolean NOT NULL DEFAULT true;
