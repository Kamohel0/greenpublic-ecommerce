-- Quarantine orphan rows and add FK constraints for production safety
-- Moves invalid references into *_orphan tables for manual remediation
-- Then adds FK constraints to enforce integrity going forward

-- 1) Create orphan tables (structure-only copies)
CREATE TABLE IF NOT EXISTS orders_orphan LIKE orders;
CREATE TABLE IF NOT EXISTS products_orphan LIKE products;

-- Resolve order items table name (orderItems vs order_items)
SET @order_items_table := (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name IN ('orderItems', 'order_items')
    ORDER BY FIELD(table_name, 'orderItems', 'order_items')
    LIMIT 1
);

SET @sql := IF(
    @order_items_table IS NULL,
    'SELECT 1',
    CONCAT('CREATE TABLE IF NOT EXISTS ', @order_items_table, '_orphan LIKE ', @order_items_table)
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Quarantine orders with missing addresses (and their order items)
SET @sql := IF(
    @order_items_table IS NULL,
    'SELECT 1',
    CONCAT(
        'INSERT IGNORE INTO ', @order_items_table, '_orphan ',
        'SELECT oi.* FROM ', @order_items_table, ' oi ',
        'JOIN orders o ON o.id = oi.order_id ',
        'LEFT JOIN addresses a ON a.id = o.address_id ',
        'WHERE o.address_id IS NOT NULL AND a.id IS NULL'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    @order_items_table IS NULL,
    'SELECT 1',
    CONCAT(
        'DELETE oi FROM ', @order_items_table, ' oi ',
        'JOIN orders o ON o.id = oi.order_id ',
        'LEFT JOIN addresses a ON a.id = o.address_id ',
        'WHERE o.address_id IS NOT NULL AND a.id IS NULL'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT INTO orders_orphan
SELECT o.*
FROM orders o
LEFT JOIN addresses a ON a.id = o.address_id
WHERE o.address_id IS NOT NULL AND a.id IS NULL;

DELETE o
FROM orders o
LEFT JOIN addresses a ON a.id = o.address_id
WHERE o.address_id IS NOT NULL AND a.id IS NULL;

-- 3) Quarantine products with missing categories (and their order items)
SET @sql := IF(
    @order_items_table IS NULL,
    'SELECT 1',
    CONCAT(
        'INSERT IGNORE INTO ', @order_items_table, '_orphan ',
        'SELECT oi.* FROM ', @order_items_table, ' oi ',
        'JOIN products p ON p.id = oi.product_id ',
        'LEFT JOIN categories c ON c.id = p.category_id ',
        'WHERE p.category_id IS NOT NULL AND c.id IS NULL'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    @order_items_table IS NULL,
    'SELECT 1',
    CONCAT(
        'DELETE oi FROM ', @order_items_table, ' oi ',
        'JOIN products p ON p.id = oi.product_id ',
        'LEFT JOIN categories c ON c.id = p.category_id ',
        'WHERE p.category_id IS NOT NULL AND c.id IS NULL'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT INTO products_orphan
SELECT p.*
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.category_id IS NOT NULL AND c.id IS NULL;

DELETE p
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.category_id IS NOT NULL AND c.id IS NULL;

-- 4) Make address_id NOT NULL (every future order must have a valid address)
ALTER TABLE orders MODIFY COLUMN address_id BIGINT NOT NULL;

-- 5) Add FK constraints for orders and order_items
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_address_id
    FOREIGN KEY (address_id) REFERENCES addresses (id);

ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_order_id
    FOREIGN KEY (order_id) REFERENCES orders (id);

ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_product_id
    FOREIGN KEY (product_id) REFERENCES products (id);

-- 6) Do NOT add FK for category_id (category is optional for products)
-- Products can exist independently without requiring a category assignment
ALTER TABLE products MODIFY COLUMN category_id BIGINT DEFAULT NULL;
