-- e-list MVP seed data (PostgreSQL)

INSERT INTO categories (name, slug, sort_order)
VALUES
  ('Процессоры', 'processors', 1),
  ('Видеокарты', 'video-cards', 2),
  ('Материнские платы', 'motherboards', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO brands (name, slug)
VALUES
  ('AMD', 'amd'),
  ('Intel', 'intel'),
  ('NVIDIA', 'nvidia'),
  ('ASUS', 'asus'),
  ('MSI', 'msi')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, brand_id, name, slug, model_code, description, image_url)
VALUES
  (
    (SELECT id FROM categories WHERE slug = 'processors'),
    (SELECT id FROM brands WHERE slug = 'amd'),
    'AMD Ryzen 5 7600',
    'amd-ryzen-5-7600',
    '100-100001015BOX',
    '6-core desktop processor for AM5 platform',
    'https://example.com/images/amd-ryzen-5-7600.jpg'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'processors'),
    (SELECT id FROM brands WHERE slug = 'intel'),
    'Intel Core i5-14600K',
    'intel-core-i5-14600k',
    'BX8071514600K',
    '14-core desktop processor for LGA1700 platform',
    'https://example.com/images/intel-core-i5-14600k.jpg'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'video-cards'),
    (SELECT id FROM brands WHERE slug = 'nvidia'),
    'GeForce RTX 4070 SUPER',
    'geforce-rtx-4070-super',
    'RTX4070S',
    '1440p gaming graphics card',
    'https://example.com/images/rtx-4070-super.jpg'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'motherboards'),
    (SELECT id FROM brands WHERE slug = 'asus'),
    'ASUS TUF GAMING B650-PLUS',
    'asus-tuf-gaming-b650-plus',
    'TUF-B650-PLUS',
    'AM5 motherboard with DDR5 support',
    'https://example.com/images/asus-tuf-b650-plus.jpg'
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO attributes (category_id, name, slug, value_type, unit, sort_order)
VALUES
  ((SELECT id FROM categories WHERE slug = 'processors'), 'Сокет', 'socket', 'text', NULL, 1),
  ((SELECT id FROM categories WHERE slug = 'processors'), 'Ядра', 'cores', 'number', NULL, 2),
  ((SELECT id FROM categories WHERE slug = 'processors'), 'Базовая частота', 'base-frequency', 'number', 'GHz', 3),
  ((SELECT id FROM categories WHERE slug = 'video-cards'), 'Видеопамять', 'vram', 'number', 'GB', 1),
  ((SELECT id FROM categories WHERE slug = 'video-cards'), 'Тип памяти', 'memory-type', 'text', NULL, 2),
  ((SELECT id FROM categories WHERE slug = 'video-cards'), 'Длина', 'length', 'number', 'mm', 3),
  ((SELECT id FROM categories WHERE slug = 'motherboards'), 'Сокет', 'socket', 'text', NULL, 1),
  ((SELECT id FROM categories WHERE slug = 'motherboards'), 'Форм-фактор', 'form-factor', 'text', NULL, 2),
  ((SELECT id FROM categories WHERE slug = 'motherboards'), 'Тип памяти', 'memory-type', 'text', NULL, 3)
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO product_attribute_values (product_id, attribute_id, value)
VALUES
  (
    (SELECT id FROM products WHERE slug = 'amd-ryzen-5-7600'),
    (SELECT id FROM attributes WHERE slug = 'socket' AND category_id = (SELECT id FROM categories WHERE slug = 'processors')),
    to_jsonb('AM5'::text)
  ),
  (
    (SELECT id FROM products WHERE slug = 'amd-ryzen-5-7600'),
    (SELECT id FROM attributes WHERE slug = 'cores' AND category_id = (SELECT id FROM categories WHERE slug = 'processors')),
    to_jsonb(6)
  ),
  (
    (SELECT id FROM products WHERE slug = 'amd-ryzen-5-7600'),
    (SELECT id FROM attributes WHERE slug = 'base-frequency' AND category_id = (SELECT id FROM categories WHERE slug = 'processors')),
    to_jsonb(3.8)
  ),
  (
    (SELECT id FROM products WHERE slug = 'intel-core-i5-14600k'),
    (SELECT id FROM attributes WHERE slug = 'socket' AND category_id = (SELECT id FROM categories WHERE slug = 'processors')),
    to_jsonb('LGA1700'::text)
  ),
  (
    (SELECT id FROM products WHERE slug = 'intel-core-i5-14600k'),
    (SELECT id FROM attributes WHERE slug = 'cores' AND category_id = (SELECT id FROM categories WHERE slug = 'processors')),
    to_jsonb(14)
  ),
  (
    (SELECT id FROM products WHERE slug = 'geforce-rtx-4070-super'),
    (SELECT id FROM attributes WHERE slug = 'vram' AND category_id = (SELECT id FROM categories WHERE slug = 'video-cards')),
    to_jsonb(12)
  ),
  (
    (SELECT id FROM products WHERE slug = 'geforce-rtx-4070-super'),
    (SELECT id FROM attributes WHERE slug = 'memory-type' AND category_id = (SELECT id FROM categories WHERE slug = 'video-cards')),
    to_jsonb('GDDR6X'::text)
  ),
  (
    (SELECT id FROM products WHERE slug = 'asus-tuf-gaming-b650-plus'),
    (SELECT id FROM attributes WHERE slug = 'socket' AND category_id = (SELECT id FROM categories WHERE slug = 'motherboards')),
    to_jsonb('AM5'::text)
  ),
  (
    (SELECT id FROM products WHERE slug = 'asus-tuf-gaming-b650-plus'),
    (SELECT id FROM attributes WHERE slug = 'form-factor' AND category_id = (SELECT id FROM categories WHERE slug = 'motherboards')),
    to_jsonb('ATX'::text)
  )
ON CONFLICT (product_id, attribute_id) DO NOTHING;

INSERT INTO shops (name, slug, website_url, rating)
VALUES
  ('DNS', 'dns', 'https://www.dns-shop.ru', 4.50),
  ('Ситилинк', 'citilink', 'https://www.citilink.ru', 4.30),
  ('Регард', 'regard', 'https://www.regard.ru', 4.20)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO offers (product_id, shop_id, external_offer_id, product_url, availability, price, currency, updated_from_source_at)
VALUES
  (
    (SELECT id FROM products WHERE slug = 'amd-ryzen-5-7600'),
    (SELECT id FROM shops WHERE slug = 'dns'),
    'dns-amd-7600',
    'https://example.com/offers/dns-amd-7600',
    'in_stock',
    19999.00,
    'RUB',
    NOW()
  ),
  (
    (SELECT id FROM products WHERE slug = 'intel-core-i5-14600k'),
    (SELECT id FROM shops WHERE slug = 'citilink'),
    'citilink-i5-14600k',
    'https://example.com/offers/citilink-i5-14600k',
    'in_stock',
    30999.00,
    'RUB',
    NOW()
  ),
  (
    (SELECT id FROM products WHERE slug = 'geforce-rtx-4070-super'),
    (SELECT id FROM shops WHERE slug = 'regard'),
    'regard-rtx4070s',
    'https://example.com/offers/regard-rtx4070s',
    'preorder',
    78999.00,
    'RUB',
    NOW()
  )
ON CONFLICT (shop_id, product_id, external_offer_id) DO NOTHING;

INSERT INTO price_history (offer_id, price, currency, captured_at)
SELECT o.id, o.price, o.currency, NOW() - INTERVAL '2 day'
FROM offers o
ON CONFLICT DO NOTHING;
