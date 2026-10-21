-- GreenPublic Production Database Migration
-- Migration: V002_ADD_PRODUCTION_FIELDS.sql
-- Description: Add missing fields for AWS production deployment
-- ============================================================================
-- ORDER TABLE - Add payment tracking & shipping fields
-- ============================================================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'PENDING' AFTER status,
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100) AFTER paid_at,
ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(20) DEFAULT 'NOT_SHIPPED' AFTER tracking_number,
ADD COLUMN IF NOT EXISTS internal_notes TEXT AFTER shipping_status,
ADD COLUMN IF NOT EXISTS customer_notes TEXT AFTER internal_notes,
ADD COLUMN IF NOT EXISTS last_modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER updated_at,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'YOCO' AFTER payment_status,
ADD INDEX idx_payment_status (payment_status),
ADD INDEX idx_shipping_status (shipping_status),
ADD INDEX idx_tracking_number (tracking_number);

-- ============================================================================
-- USER TABLE - Add security & audit fields
-- ============================================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) AFTER surname,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE AFTER is_mfa_enabled,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(100) AFTER two_factor_enabled,
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0 AFTER is_locked,
ADD COLUMN IF NOT EXISTS account_locked_until DATETIME AFTER failed_login_attempts,
ADD COLUMN IF NOT EXISTS password_changed_at DATETIME AFTER password,
ADD COLUMN IF NOT EXISTS last_ip_address VARCHAR(45) AFTER last_login_ip,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE AFTER is_active,
ADD COLUMN IF NOT EXISTS data_deletion_requested_at DATETIME AFTER marketing_consent,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE AFTER is_active,
ADD INDEX idx_phone_number (phone_number),
ADD INDEX idx_account_locked_until (account_locked_until),
ADD INDEX idx_data_deletion_requested (data_deletion_requested_at),
ADD INDEX idx_is_verified (is_verified);

-- ============================================================================
-- PRODUCT TABLE - Add inventory & analytics fields
-- ============================================================================
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE AFTER id,
ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) UNIQUE AFTER sku,
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) AFTER price,
ADD COLUMN IF NOT EXISTS min_stock_level INT DEFAULT 10 AFTER stock_quantity,
ADD COLUMN IF NOT EXISTS max_stock_level INT DEFAULT 1000 AFTER min_stock_level,
ADD COLUMN IF NOT EXISTS views_count BIGINT DEFAULT 0 AFTER is_active,
ADD COLUMN IF NOT EXISTS purchases_count BIGINT DEFAULT 0 AFTER views_count,
ADD COLUMN IF NOT EXISTS average_rating DOUBLE DEFAULT 0.0 AFTER purchases_count,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE AFTER is_active,
ADD COLUMN IF NOT EXISTS featured_until DATETIME AFTER is_featured,
ADD COLUMN IF NOT EXISTS supplier_id BIGINT AFTER category_id,
ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT TRUE AFTER is_active,
ADD COLUMN IF NOT EXISTS tax_category VARCHAR(50) AFTER is_taxable,
ADD COLUMN IF NOT EXISTS is_returnable BOOLEAN DEFAULT TRUE AFTER is_active,
ADD COLUMN IF NOT EXISTS return_window_days INT DEFAULT 30 AFTER is_returnable,
ADD INDEX idx_sku (sku),
ADD INDEX idx_barcode (barcode),
ADD INDEX idx_supplier_id (supplier_id),
ADD INDEX idx_is_featured (is_featured),
ADD INDEX idx_views_count (views_count),
ADD INDEX idx_purchases_count (purchases_count),
ADD INDEX idx_is_returnable (is_returnable);

-- ============================================================================
-- ORDER_ITEMS TABLE - Add snapshot & discount fields
-- ============================================================================
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_snapshot_name VARCHAR(255) AFTER product_id,
ADD COLUMN IF NOT EXISTS product_snapshot_description TEXT AFTER product_snapshot_name,
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10, 2) DEFAULT 0 AFTER unit_price,
ADD COLUMN IF NOT EXISTS discount_reason VARCHAR(255) AFTER discount_applied,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0 AFTER price,
ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER tax_amount,
ADD INDEX idx_created_at (created_at);

-- ============================================================================
-- ADDRESS TABLE - Add validation fields
-- ============================================================================
ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT FALSE AFTER is_default,
ADD COLUMN IF NOT EXISTS validation_timestamp DATETIME AFTER is_valid,
ADD COLUMN IF NOT EXISTS verification_required BOOLEAN DEFAULT FALSE AFTER is_valid,
ADD INDEX idx_is_valid (is_valid),
ADD INDEX idx_verification_required (verification_required);

-- ============================================================================
-- NEW TABLES
-- ============================================================================
-- Payment Transactions Table
CREATE TABLE
    IF NOT EXISTS payment_transactions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT NOT NULL,
        transaction_id VARCHAR(255) UNIQUE,
        amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        error_message TEXT,
        error_code VARCHAR(50),
        payment_method VARCHAR(50),
        card_last_4 VARCHAR(4),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        INDEX idx_order_id (order_id),
        INDEX idx_transaction_id (transaction_id),
        INDEX idx_status (status),
        INDEX idx_timestamp (timestamp)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Refunds Table
CREATE TABLE
    IF NOT EXISTS refunds (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT NOT NULL UNIQUE,
        refund_amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        yoco_refund_id VARCHAR(255),
        refund_reason TEXT NOT NULL,
        internal_notes TEXT,
        requested_by VARCHAR(255),
        requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        INDEX idx_order_id (order_id),
        INDEX idx_status (status),
        INDEX idx_yoco_refund_id (yoco_refund_id),
        INDEX idx_requested_at (requested_at)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Audit Logs Table
CREATE TABLE
    IF NOT EXISTS audit_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id BIGINT,
        old_value LONGTEXT,
        new_value LONGTEXT,
        performed_by_user_id BIGINT,
        performed_by_ip VARCHAR(45),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (performed_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
        INDEX idx_action (action),
        INDEX idx_entity_type (entity_type),
        INDEX idx_entity_id (entity_id),
        INDEX idx_timestamp (timestamp),
        INDEX idx_performed_by (performed_by_user_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Promo Codes Table
CREATE TABLE
    IF NOT EXISTS promo_codes (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(20) NOT NULL,
        discount_value DECIMAL(10, 2) NOT NULL,
        usage_limit INT,
        usage_count INT DEFAULT 0,
        valid_from DATETIME NOT NULL,
        valid_until DATETIME NOT NULL,
        min_purchase_amount DECIMAL(12, 2),
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_is_active (is_active),
        INDEX idx_valid_from (valid_from),
        INDEX idx_valid_until (valid_until)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Inventory Transactions Table
CREATE TABLE
    IF NOT EXISTS inventory_transactions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT NOT NULL,
        quantity_change INT NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        reference VARCHAR(255),
        notes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        INDEX idx_product_id (product_id),
        INDEX idx_transaction_type (transaction_type),
        INDEX idx_timestamp (timestamp),
        INDEX idx_reference (reference)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Cart Abandonment Logs Table
CREATE TABLE
    IF NOT EXISTS cart_abandonment_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        cart_value DECIMAL(12, 2) NOT NULL,
        abandoned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        recovery_email_sent_at DATETIME,
        recovered BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_abandoned_at (abandoned_at),
        INDEX idx_recovered (recovered)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- System Configuration Table (for feature flags, maintenance mode, etc)
CREATE TABLE
    IF NOT EXISTS system_config (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(255) UNIQUE NOT NULL,
        config_value VARCHAR(255),
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by_user_id BIGINT,
        INDEX idx_config_key (config_key),
        FOREIGN KEY (updated_by_user_id) REFERENCES users (id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================================
-- VERIFY EXISTING INDEXES
-- ============================================================================
-- Add missing indexes if not present
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_user_id (user_id);

ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_created_at (created_at);

ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_status (status);

ALTER TABLE users ADD INDEX IF NOT EXISTS idx_email (email);

ALTER TABLE users ADD INDEX IF NOT EXISTS idx_created_at (created_at);

ALTER TABLE products ADD INDEX IF NOT EXISTS idx_category_id (category_id);

ALTER TABLE products ADD INDEX IF NOT EXISTS idx_is_active (is_active);

ALTER TABLE cart_items ADD INDEX IF NOT EXISTS idx_cart_id (cart_id);

ALTER TABLE cart_items ADD INDEX IF NOT EXISTS idx_product_id (product_id);

-- ============================================================================
-- COLLATION CHECK
-- ============================================================================
-- Ensure UTF-8 collation for text fields (handle special characters)
ALTER TABLE orders CONVERT TO CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE users CONVERT TO CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE products CONVERT TO CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;