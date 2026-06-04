-- SQL migration or seed script for the backend database: 008 migration notifications.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- Create notifications table for user inbox
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar NOT NULL,
  body text,
  type varchar DEFAULT 'general',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Indexes for common queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
