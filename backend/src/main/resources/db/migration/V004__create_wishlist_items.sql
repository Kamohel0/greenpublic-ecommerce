-- Create wishlist_items table
CREATE TABLE
    IF NOT EXISTS wishlist_items (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_wishlist_user_product (user_id, product_id),
        INDEX idx_wishlist_user_id (user_id),
        INDEX idx_wishlist_product_id (product_id),
        CONSTRAINT fk_wishlist_user_id FOREIGN KEY (user_id) REFERENCES users (id),
        CONSTRAINT fk_wishlist_product_id FOREIGN KEY (product_id) REFERENCES products (id)
    );