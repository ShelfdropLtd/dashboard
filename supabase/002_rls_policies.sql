-- RLS Policies for all tables
-- Admin email: george@shelfdrop.com

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Brands policies
CREATE POLICY "Admin can view all brands" ON brands
  FOR SELECT USING (auth.jwt() ->> 'email' = 'george@shelfdrop.com');

CREATE POLICY "Users can view own brand" ON brands
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own brand" ON brands
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own brand" ON brands
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin can update any brand" ON brands
  FOR UPDATE USING (auth.jwt() ->> 'email' = 'george@shelfdrop.com');

CREATE POLICY "Admin can delete any brand" ON brands
  FOR DELETE USING (auth.jwt() ->> 'email' = 'george@shelfdrop.com');

-- Brand products policies
CREATE POLICY "Admin can view all products" ON brand_products
  FOR SELECT USING (auth.jwt() ->> 'email' = 'george@shelfdrop.com');

CREATE POLICY "Brands can view own products" ON brand_products
  FOR SELECT USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Brands can insert own products" ON brand_products
  FOR INSERT WITH CHECK (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'george@shelfdrop.com'
  );

CREATE POLICY "Admin can update any product" ON brand_products
  FOR UPDATE USING (auth.jwt() ->> 'email' = 'george@shelfdrop.com');

CREATE POLICY "Brands can update own pending products" ON brand_products
  FOR UPDATE USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    AND status = 'pending'
  );

CREATE POLICY "Admin can delete any product" ON brand_products
  FOR DELETE USING (auth.jwt() ->> 'email' = 'george@shelfdrop.com');

CREATE POLICY "Brands can delete own pending products" ON brand_products
  FOR DELETE USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    AND status = 'pending'
  );

-- Purchase orders policies
CREATE POLICY "Admin can do anything with POs" ON purchase_orders
  FOR ALL USING (auth.jwt() ->> 'email' = 'george@shelfdrop.com');

CREATE POLICY "Brands can view own POs" ON purchase_orders
  FOR SELECT USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Brands can update own POs" ON purchase_orders
  FOR UPDATE USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

-- Purchase order items policies
CREATE POLICY "Admin can do anything with PO items" ON purchase_order_items
  FOR ALL USING (auth.jwt() ->> 'email' = 'george@shelfdrop.com');

CREATE POLICY "Brands can view own PO items" ON purchase_order_items
  FOR SELECT USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders WHERE brand_id IN (
        SELECT id FROM brands WHERE user_id = auth.uid()
      )
    )
  );

-- Invoices policies
CREATE POLICY "Admin can do anything with invoices" ON invoices
  FOR ALL USING (auth.jwt() ->> 'email' = 'george@shelfdrop.com');

CREATE POLICY "Brands can view own invoices" ON invoices
  FOR SELECT USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Brands can insert own invoices" ON invoices
  FOR INSERT WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Brands can update own invoices" ON invoices
  FOR UPDATE USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

-- Invoice items policies
CREATE POLICY "Admin can do anything with invoice items" ON invoice_items
  FOR ALL USING (auth.jwt() ->> 'email' = 'george@shelfdrop.com');

CREATE POLICY "Brands can view own invoice items" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE brand_id IN (
        SELECT id FROM brands WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Brands can insert own invoice items" ON invoice_items
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE brand_id IN (
        SELECT id FROM brands WHERE user_id = auth.uid()
      )
    )
  );

-- Promotions policies
CREATE POLICY "Admin can do anything with promotions" ON promotions
  FOR ALL USING (auth.jwt() ->> 'email' = 'george@shelfdrop.com');

CREATE POLICY "Brands can view own promotions" ON promotions
  FOR SELECT USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Brands can insert own promotions" ON promotions
  FOR INSERT WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Brands can update own pending promotions" ON promotions
  FOR UPDATE USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    AND status IN ('pending', 'rejected')
  );
