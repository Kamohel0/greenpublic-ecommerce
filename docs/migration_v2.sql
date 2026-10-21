-- ================================================================
-- Green Public Ecommerce - Database Migration
-- Version: 2.0
-- Date: January 26, 2026
-- Description: Add surname field to users table for profile feature
-- ================================================================

-- Start transaction for safety
BEGIN;

-- 1. Add surname column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS surname VARCHAR(255);

-- 2. Set default empty string for existing users
-- This prevents NULL issues in profile forms
UPDATE users 
SET surname = '' 
WHERE surname IS NULL;

-- 3. Add index on email for faster authentication lookups
-- (If not already exists)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 4. Add index on token_version for token invalidation
CREATE INDEX IF NOT EXISTS idx_users_token_version ON users(token_version);

-- 5. Verify migration
DO $$ 
DECLARE 
    column_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'surname'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'Migration successful: surname column added to users table';
    ELSE
        RAISE EXCEPTION 'Migration failed: surname column not found';
    END IF;
END $$;

-- Commit transaction
COMMIT;

-- ================================================================
-- Rollback script (if needed):
-- ================================================================
-- BEGIN;
-- ALTER TABLE users DROP COLUMN IF EXISTS surname;
-- DROP INDEX IF EXISTS idx_users_email;
-- DROP INDEX IF EXISTS idx_users_token_version;
-- COMMIT;
-- ================================================================
