-- Sample catalogue for local development and the demo site.
-- Run AFTER the backend has started once (so the tables exist):
--   mysql -u greenpublic -p greenpublic < docs/dev-seed.sql
-- Product images are matched by name in the frontend, so image_url can stay empty.

INSERT INTO categories (name, status) VALUES
  ('gels', TRUE),
  ('skincare', TRUE),
  ('oils', TRUE);

INSERT INTO products (name, description, price, stock_quantity, reserved_quantity, is_active, weight, category_id, created_at, updated_at, version) VALUES
  ('Sea Moss Gel', 'Pure Irish sea moss gel packed with 92 essential minerals for daily wellness and vitality.', 120.00, 50, 0, TRUE, '250ml',
     (SELECT id FROM categories WHERE name = 'gels'), NOW(), NOW(), 0),
  ('Sea Moss Body Butter', 'Luxuriously rich body butter with shea butter and sea moss for silky smooth, deeply nourished skin.', 180.00, 40, 0, TRUE, '200ml',
     (SELECT id FROM categories WHERE name = 'skincare'), NOW(), NOW(), 0),
  ('Sea Moss Oil', 'Nourishing blend of sea moss and essential oils for hair growth and skin radiance.', 100.00, 40, 0, TRUE, '100ml',
     (SELECT id FROM categories WHERE name = 'oils'), NOW(), NOW(), 0),
  ('Sea Moss Lip Balm', 'Soothing lip care infused with sea moss and natural moisturizers for soft, hydrated lips.', 80.00, 60, 0, TRUE, '15g',
     (SELECT id FROM categories WHERE name = 'skincare'), NOW(), NOW(), 0);
