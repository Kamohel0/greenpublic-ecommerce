-- Add fulfillment tracking and pickup notification timestamp to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(40) NOT NULL DEFAULT 'PLACED';

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS fulfillment_updated_at DATETIME NULL;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS pickup_ready_notified_at DATETIME NULL;