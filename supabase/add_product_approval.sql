-- Add approval workflow fields to brand_products table
ALTER TABLE brand_products
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS wholesale_price numeric(10,2),
ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update existing products to be approved (since admin added them)
UPDATE brand_products SET status = 'approved' WHERE status IS NULL OR status = 'pending';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_brand_products_status ON brand_products(status);

-- RLS policies for brands to manage their own products
DROP POLICY IF EXISTS "Brands can view their own products" ON brand_products;
CREATE POLICY "Brands can view their own products" ON brand_products
  FOR SELECT USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'george@shelfdrop.com'
  );

DROP POLICY IF EXISTS "Brands can insert their own products" ON brand_products;
CREATE POLICY "Brands can insert their own products" ON brand_products
  FOR INSERT WITH CHECK (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'george@shelfdrop.com'
  );

DROP POLICY IF EXISTS "Brands can update their own pending products" ON brand_products;
CREATE POLICY "Brands can update their own pending products" ON brand_products
  FOR UPDATE USING (
    (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()) AND status = 'pending')
    OR auth.jwt() ->> 'email' = 'george@shelfdrop.com'
  );

DROP POLICY IF EXISTS "Brands can delete their own pending products" ON brand_products;
CREATE POLICY "Brands can delete their own pending products" ON brand_products
  FOR DELETE USING (
    (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()) AND status = 'pending')
    OR auth.jwt() ->> 'email' = 'george@shelfdrop.com'
  );
