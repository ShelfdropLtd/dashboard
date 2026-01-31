-- Run this in Supabase SQL Editor to add onboarding stages and related tables

-- Update brands table with onboarding stage
ALTER TABLE brands ADD COLUMN IF NOT EXISTS onboarding_stage TEXT DEFAULT 'application'
  CHECK (onboarding_stage IN ('application', 'pending_review', 'pricing_review', 'pricing_accepted', 'contract_signing', 'shipping_setup', 'onboarding_complete'));

ALTER TABLE brands ADD COLUMN IF NOT EXISTS pricing_submitted_at TIMESTAMPTZ;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS pricing_accepted_at TIMESTAMPTZ;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS first_shipment_received_at TIMESTAMPTZ;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- SKU Offers table - Shelfdrop creates pricing offers for each product
CREATE TABLE IF NOT EXISTS sku_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,

  -- Product info (from Master Product Sheet)
  product_name TEXT NOT NULL,
  sku_code TEXT,
  ean_barcode TEXT,
  abv_percent DECIMAL(5,2),
  volume_ml INTEGER,
  units_per_case INTEGER,

  -- Pricing
  brand_wholesale_price DECIMAL(10,2), -- Price brand wants to sell at
  shelfdrop_offer_price DECIMAL(10,2), -- Our offer price
  rrp DECIMAL(10,2),
  min_selling_price DECIMAL(10,2),

  -- Margin calculations (calculated fields)
  estimated_margin_percent DECIMAL(5,2),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'offered', 'accepted', 'rejected', 'negotiating')),
  brand_notes TEXT,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  offered_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,

  contract_type TEXT NOT NULL CHECK (contract_type IN ('distribution_agreement', 'consignment_terms', 'data_processing', 'other')),
  title TEXT NOT NULL,
  description TEXT,

  -- Document
  document_url TEXT, -- Link to PDF/document

  -- Signing
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'signed', 'expired')),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signed_by TEXT, -- Name of signatory
  signed_ip TEXT, -- IP address for audit
  signature_data TEXT, -- Base64 signature if captured

  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping Plans (ASN - Advanced Shipping Notification)
CREATE TABLE IF NOT EXISTS shipping_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,

  -- Plan details
  plan_name TEXT NOT NULL,
  reference_number TEXT UNIQUE,

  -- Shipping info
  ship_from_address TEXT,
  ship_from_contact TEXT,
  ship_from_phone TEXT,

  -- Destination (Shelfdrop warehouse)
  destination_warehouse TEXT DEFAULT 'Shelfdrop Fulfilment Centre',
  destination_address TEXT,

  -- Dates
  expected_ship_date DATE,
  expected_arrival_date DATE,
  actual_ship_date DATE,
  actual_arrival_date DATE,

  -- Carrier
  carrier_name TEXT,
  tracking_number TEXT,

  -- Totals
  total_cases INTEGER DEFAULT 0,
  total_units INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'in_transit', 'delivered', 'received', 'discrepancy', 'cancelled')),

  -- Notes
  brand_notes TEXT,
  warehouse_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ
);

-- Shipping Plan Line Items
CREATE TABLE IF NOT EXISTS shipping_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_plan_id UUID REFERENCES shipping_plans(id) ON DELETE CASCADE,
  sku_offer_id UUID REFERENCES sku_offers(id),

  product_name TEXT NOT NULL,
  sku_code TEXT,
  ean_barcode TEXT,

  cases_qty INTEGER NOT NULL DEFAULT 0,
  units_per_case INTEGER NOT NULL DEFAULT 1,
  total_units INTEGER GENERATED ALWAYS AS (cases_qty * units_per_case) STORED,

  -- Receiving
  received_cases INTEGER,
  received_units INTEGER,
  discrepancy_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Log table for tracking automated emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  email_type TEXT NOT NULL, -- 'application_submitted', 'approved', 'pricing_ready', etc.
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE sku_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- SKU Offers policies
CREATE POLICY "Brands can view their own SKU offers" ON sku_offers
  FOR SELECT USING (
    brand_id IN (SELECT brand_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage all SKU offers" ON sku_offers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Contracts policies
CREATE POLICY "Brands can view their own contracts" ON contracts
  FOR SELECT USING (
    brand_id IN (SELECT brand_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Brands can update their own contracts" ON contracts
  FOR UPDATE USING (
    brand_id IN (SELECT brand_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage all contracts" ON contracts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Shipping plans policies
CREATE POLICY "Brands can view their own shipping plans" ON shipping_plans
  FOR SELECT USING (
    brand_id IN (SELECT brand_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Brands can manage their own shipping plans" ON shipping_plans
  FOR ALL USING (
    brand_id IN (SELECT brand_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage all shipping plans" ON shipping_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Shipping plan items policies
CREATE POLICY "Brands can view their own shipping plan items" ON shipping_plan_items
  FOR SELECT USING (
    shipping_plan_id IN (
      SELECT id FROM shipping_plans WHERE brand_id IN (
        SELECT brand_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Brands can manage their own shipping plan items" ON shipping_plan_items
  FOR ALL USING (
    shipping_plan_id IN (
      SELECT id FROM shipping_plans WHERE brand_id IN (
        SELECT brand_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage all shipping plan items" ON shipping_plan_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Generate reference numbers for shipping plans
CREATE OR REPLACE FUNCTION generate_shipping_reference()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reference_number := 'ASN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_shipping_reference
  BEFORE INSERT ON shipping_plans
  FOR EACH ROW
  WHEN (NEW.reference_number IS NULL)
  EXECUTE FUNCTION generate_shipping_reference();
