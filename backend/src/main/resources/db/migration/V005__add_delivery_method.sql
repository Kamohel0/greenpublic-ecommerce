-- GreenPublic Delivery Method Migration
-- Migration: V005__add_delivery_method.sql
-- Description: Add delivery method column to orders table for pickup vs delivery selection
-- ============================================================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(20) NOT NULL DEFAULT 'delivery' AFTER shipping_cost,
ADD INDEX idx_delivery_method (delivery_method);

-- Comment: delivery_method can be 'delivery' (via The Courier Guy) or 'pickup' (at FNB Bank City)
