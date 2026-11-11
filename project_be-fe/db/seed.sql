INSERT INTO categories (name, slug) VALUES
  ('อะไหล่รถยนต์', 'auto'),
  ('เครื่องมือช่าง', 'tools'),
  ('ของใช้ในบ้าน', 'home'),
  ('สุขภาพ', 'health'),
  ('อิเล็กทรอนิกส์', 'electronics'),
  ('ความงาม', 'beauty');

INSERT INTO products (category_id, name, description, price_satang, image_url, stock) VALUES
  ((SELECT id FROM categories WHERE slug='auto'), 'ปีกนกล่าง Chevrolet Sonic', 'ปีกนกคู่ซ้ายขวา', 90000, 'https://placehold.co/400x400?text=Wishbone', 12),
  ((SELECT id FROM categories WHERE slug='auto'), 'หลอดไฟ LED 12V 15W', 'ไฟหน้ารถยนต์ 2 ดวง', 17000, 'https://placehold.co/400x400?text=LED+Bulb', 40),
  ((SELECT id FROM categories WHERE slug='auto'), 'O-Ring ขนาด 3.5 มม.', 'แพ็ก 10 ชิ้น', 1080000 / 1000 * 100, 'https://placehold.co/400x400?text=O-Ring', 100),
  ((SELECT id FROM categories WHERE slug='tools'), 'ชุดไขควง 6 ตัว', 'ด้ามยาง ปลายแม่เหล็ก', 35000, 'https://placehold.co/400x400?text=Screwdriver', 25),
  ((SELECT id FROM categories WHERE slug='tools'), 'สว่านไร้สาย 12V', 'พร้อมแบตเตอรี่ 2 ก้อน', 129000, 'https://placehold.co/400x400?text=Drill', 8),
  ((SELECT id FROM categories WHERE slug='tools'), 'คีมปากจิ้งจก 8 นิ้ว', 'เหล็กคุณภาพสูง', 12000, 'https://placehold.co/400x400?text=Pliers', 30),
  ((SELECT id FROM categories WHERE slug='home'), 'ถังขยะแยกประเภท 2 ช่อง', 'ฝาเปิดอัตโนมัติ', 45000, 'https://placehold.co/400x400?text=Bin', 15),
  ((SELECT id FROM categories WHERE slug='home'), 'ชุดจานชามเซรามิก 12 ชิ้น', 'ลายดอกไม้', 89000, 'https://placehold.co/400x400?text=Dishes', 10),
  ((SELECT id FROM categories WHERE slug='health'), 'แอลคาร์นิทีน 30 แคปซูล', 'อาหารเสริม', 59000, 'https://placehold.co/400x400?text=L-Carnitine', 20),
  ((SELECT id FROM categories WHERE slug='electronics'), 'พัดลม CPU ระบายความร้อน', 'รองรับซ็อกเก็ต Intel/AMD', 25000, 'https://placehold.co/400x400?text=CPU+Fan', 18),
  ((SELECT id FROM categories WHERE slug='electronics'), 'สายชาร์จ USB-C 1 เมตร', 'รองรับชาร์จเร็ว', 9900, 'https://placehold.co/400x400?text=USB-C', 60),
  ((SELECT id FROM categories WHERE slug='beauty'), 'กระจกแต่งหน้าไฟ LED', 'ปรับแสงได้ 3 โหมด', 39900, 'https://placehold.co/400x400?text=Mirror', 9);