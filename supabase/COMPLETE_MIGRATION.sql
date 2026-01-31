-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text DEFAULT 'brand',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text,
  company_name text,
  contact_name text,
  contact_email text,
  phone text,
  website text,
  about text,
  current_channels text[],
  target_channels text[],
  product_categories text[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Brand products table
CREATE TABLE IF NOT EXISTS brand_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  sku_code text NOT NULL,
  product_name text NOT NULL,
  size text,
  unit_cost numeric(10,2) NOT NULL,
  unit_price numeric(10,2),
  wholesale_price numeric(10,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamp with time zone DEFAULT now(),
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  po_number text NOT NULL UNIQUE,
  status text DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'accepted', 'rejected', 'completed')),
  total_amount numeric(12,2),
  notes text,
  accepted_at timestamp with time zone,
  rejected_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES brand_products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  sku_code text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(12,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'paid', 'overdue')),
  total_amount numeric(12,2),
  notes text,
  submitted_at timestamp with time zone,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES brand_products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  sku_code text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(12,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  product_id uuid REFERENCES brand_products(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  promotion_type text DEFAULT 'admin_created' CHECK (promotion_type IN ('admin_created', 'brand_suggested')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  funding_per_unit numeric(10,2),
  units_committed integer,
  discount_percentage numeric(5,2),
  channel text,
  notes text,
  rejection_reason text,
  created_by text, -- 'admin' or 'brand'
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
CREATE INDEX IF NOT EXISTS idx_brand_products_brand_id ON brand_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_products_status ON brand_products(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_brand_id ON purchase_orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_invoices_brand_id ON invoices(brand_id);
CREATE INDEX IF NOT EXISTS idx_promotions_brand_id ON promotions(brand_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
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
-- Support Tickets / Conversations System

-- Channels (like Slack channels for organizing conversations)
CREATE TABLE IF NOT EXISTS support_channels (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel_type text DEFAULT 'general' CHECK (channel_type IN ('general', 'orders', 'products', 'billing', 'promotions', 'other')),
  is_archived boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Messages within channels
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id uuid REFERENCES support_channels(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('admin', 'brand')),
  sender_id uuid,
  sender_name text,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_channels_brand_id ON support_channels(brand_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_channel_id ON support_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at);

-- Enable RLS
ALTER TABLE support_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_channels
CREATE POLICY "Admin can do anything with channels" ON support_channels
  FOR ALL USING (auth.jwt() ->> 'email' = 'george@shelfdrop.com');

CREATE POLICY "Brands can view own channels" ON support_channels
  FOR SELECT USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Brands can create own channels" ON support_channels
  FOR INSERT WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

-- RLS Policies for support_messages
CREATE POLICY "Admin can do anything with messages" ON support_messages
  FOR ALL USING (auth.jwt() ->> 'email' = 'george@shelfdrop.com');

CREATE POLICY "Brands can view own channel messages" ON support_messages
  FOR SELECT USING (
    channel_id IN (
      SELECT id FROM support_channels WHERE brand_id IN (
        SELECT id FROM brands WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Brands can insert messages in own channels" ON support_messages
  FOR INSERT WITH CHECK (
    channel_id IN (
      SELECT id FROM support_channels WHERE brand_id IN (
        SELECT id FROM brands WHERE user_id = auth.uid()
      )
    )
  );

-- Function to auto-create default channel when brand is approved
CREATE OR REPLACE FUNCTION create_default_support_channel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO support_channels (brand_id, name, channel_type)
    VALUES (NEW.id, 'General', 'general');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create channel on brand approval
DROP TRIGGER IF EXISTS on_brand_approved ON brands;
CREATE TRIGGER on_brand_approved
  AFTER UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION create_default_support_channel();
-- =====================================================
-- SHELFDROP: Shipments, Duties & P&L System
-- =====================================================

-- =====================================================
-- INBOUND SHIPMENTS (Brand → Shelfdrop Warehouse)
-- =====================================================
CREATE TABLE IF NOT EXISTS inbound_shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,

    -- Shipment details
    reference_number TEXT NOT NULL,
    carrier TEXT,
    tracking_number TEXT,

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Created, awaiting dispatch
        'in_transit',   -- On the way
        'received',     -- Arrived at warehouse
        'checked_in',   -- Fully verified and added to inventory
        'issue'         -- Problem with shipment
    )),

    -- Dates
    expected_date DATE,
    dispatched_date DATE,
    received_date TIMESTAMPTZ,
    checked_in_date TIMESTAMPTZ,

    -- Bond status
    is_bonded BOOLEAN DEFAULT false,
    bond_warehouse_ref TEXT,

    -- Notes
    notes TEXT,
    issue_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbound shipment items
CREATE TABLE IF NOT EXISTS inbound_shipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES inbound_shipments(id) ON DELETE CASCADE,
    product_id UUID REFERENCES brand_products(id) ON DELETE CASCADE,

    quantity_expected INTEGER NOT NULL DEFAULT 0,
    quantity_received INTEGER DEFAULT 0,
    quantity_damaged INTEGER DEFAULT 0,

    -- Cost tracking for COGS
    unit_cost DECIMAL(10,2), -- Brand's cost per unit

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- OUTBOUND SHIPMENTS (Shelfdrop → Customer/Retailer)
-- =====================================================
CREATE TABLE IF NOT EXISTS outbound_shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    purchase_order_id UUID REFERENCES purchase_orders(id),

    -- Shipment details
    reference_number TEXT NOT NULL,
    carrier TEXT NOT NULL,
    service_type TEXT, -- e.g., "Next Day", "Standard", "Pallet"
    tracking_number TEXT,

    -- Destination
    destination_type TEXT CHECK (destination_type IN ('customer', 'retailer', 'amazon_fba', 'other')),
    destination_name TEXT,
    destination_address TEXT,
    destination_postcode TEXT,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'picked',
        'packed',
        'dispatched',
        'delivered',
        'issue'
    )),

    -- Dates
    created_date DATE DEFAULT CURRENT_DATE,
    dispatched_date TIMESTAMPTZ,
    delivered_date TIMESTAMPTZ,

    -- Costs (charged to brand)
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    handling_fee DECIMAL(10,2) DEFAULT 0,
    packaging_cost DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (shipping_cost + handling_fee + packaging_cost) STORED,

    -- Weights and dimensions
    total_weight_kg DECIMAL(8,2),
    package_count INTEGER DEFAULT 1,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outbound shipment items
CREATE TABLE IF NOT EXISTS outbound_shipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES outbound_shipments(id) ON DELETE CASCADE,
    product_id UUID REFERENCES brand_products(id) ON DELETE CASCADE,

    quantity INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DUTY RATES & BOND MANAGEMENT
-- =====================================================

-- Duty rates by product category
CREATE TABLE IF NOT EXISTS duty_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Category
    category TEXT NOT NULL, -- 'wine', 'spirits', 'beer', 'cider', 'rtd'
    subcategory TEXT, -- e.g., 'still_wine', 'sparkling_wine'

    -- Rate calculation method
    rate_type TEXT NOT NULL CHECK (rate_type IN (
        'per_litre_alcohol', -- Spirits: £X per litre of pure alcohol
        'per_hectolitre',    -- Wine/Beer: £X per hectolitre
        'fixed_per_unit'     -- Fixed amount per container
    )),

    -- The rate itself
    rate_amount DECIMAL(10,4) NOT NULL,

    -- ABV thresholds if applicable
    min_abv DECIMAL(4,2),
    max_abv DECIMAL(4,2),

    -- Effective dates
    effective_from DATE NOT NULL,
    effective_to DATE,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Duty entries (when stock is released from bond)
CREATE TABLE IF NOT EXISTS duty_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    purchase_order_id UUID REFERENCES purchase_orders(id),
    outbound_shipment_id UUID REFERENCES outbound_shipments(id),

    -- Entry details
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_number TEXT NOT NULL,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',    -- Calculated but not yet paid
        'paid',       -- Duty paid to HMRC
        'charged'     -- Charged to brand
    )),

    -- Amounts
    total_duty_amount DECIMAL(10,2) NOT NULL,
    vat_on_duty DECIMAL(10,2) DEFAULT 0,

    -- Payment tracking
    hmrc_payment_date DATE,
    hmrc_payment_ref TEXT,

    -- Charged to brand
    charged_to_brand_date DATE,
    invoice_id UUID REFERENCES invoices(id),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual items in a duty entry
CREATE TABLE IF NOT EXISTS duty_entry_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duty_entry_id UUID REFERENCES duty_entries(id) ON DELETE CASCADE,
    product_id UUID REFERENCES brand_products(id) ON DELETE CASCADE,

    quantity INTEGER NOT NULL,

    -- Product details at time of duty calculation
    abv DECIMAL(4,2),
    volume_ml INTEGER,

    -- Duty calculation
    duty_rate_id UUID REFERENCES duty_rates(id),
    duty_per_unit DECIMAL(10,4),
    total_duty DECIMAL(10,2),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FINANCIAL TRACKING (for P&L)
-- =====================================================

-- Transaction types for brand financial tracking
CREATE TABLE IF NOT EXISTS brand_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,

    -- Transaction details
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'sale',              -- Revenue from sale
        'commission',        -- Shelfdrop commission (negative)
        'fulfilment',        -- Shipping/handling costs (negative)
        'duty',              -- Duty charges (negative)
        'promotion_funding', -- Promotion costs (negative)
        'storage',           -- Storage fees (negative)
        'adjustment',        -- Manual adjustments
        'refund',            -- Customer refund (negative)
        'inbound_shipping'   -- Cost of getting stock to warehouse (negative)
    )),

    -- Related records
    purchase_order_id UUID REFERENCES purchase_orders(id),
    outbound_shipment_id UUID REFERENCES outbound_shipments(id),
    duty_entry_id UUID REFERENCES duty_entries(id),
    promotion_id UUID REFERENCES promotions(id),
    invoice_id UUID REFERENCES invoices(id),

    -- Financial
    amount DECIMAL(12,2) NOT NULL, -- Positive = credit, Negative = debit

    -- Description
    description TEXT,
    reference TEXT,

    -- Period for reporting
    period_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    period_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory tracking
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    product_id UUID REFERENCES brand_products(id) ON DELETE CASCADE,

    -- Stock levels
    quantity_in_bond INTEGER DEFAULT 0,    -- In bonded warehouse
    quantity_duty_paid INTEGER DEFAULT 0,   -- Duty-paid, ready to ship
    quantity_reserved INTEGER DEFAULT 0,    -- Reserved for orders
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_duty_paid - quantity_reserved) STORED,

    -- Cost tracking
    average_unit_cost DECIMAL(10,2),

    last_updated TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(product_id)
);

-- Storage charges (monthly)
CREATE TABLE IF NOT EXISTS storage_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,

    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,

    -- Storage details
    pallet_spaces_used DECIMAL(4,2) DEFAULT 0,
    rate_per_pallet DECIMAL(10,2) DEFAULT 15.00, -- £15/pallet/week default

    -- Calculation
    weeks_in_period INTEGER DEFAULT 4,
    total_charge DECIMAL(10,2),

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid')),
    invoice_id UUID REFERENCES invoices(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(brand_id, period_year, period_month)
);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Brand P&L Summary View
CREATE OR REPLACE VIEW brand_pnl_summary AS
SELECT
    bt.brand_id,
    bt.period_year,
    bt.period_month,

    -- Revenue
    COALESCE(SUM(CASE WHEN bt.transaction_type = 'sale' THEN bt.amount ELSE 0 END), 0) as gross_revenue,

    -- Costs
    COALESCE(SUM(CASE WHEN bt.transaction_type = 'commission' THEN bt.amount ELSE 0 END), 0) as commission_costs,
    COALESCE(SUM(CASE WHEN bt.transaction_type = 'fulfilment' THEN bt.amount ELSE 0 END), 0) as fulfilment_costs,
    COALESCE(SUM(CASE WHEN bt.transaction_type = 'duty' THEN bt.amount ELSE 0 END), 0) as duty_costs,
    COALESCE(SUM(CASE WHEN bt.transaction_type = 'promotion_funding' THEN bt.amount ELSE 0 END), 0) as promotion_costs,
    COALESCE(SUM(CASE WHEN bt.transaction_type = 'storage' THEN bt.amount ELSE 0 END), 0) as storage_costs,
    COALESCE(SUM(CASE WHEN bt.transaction_type = 'refund' THEN bt.amount ELSE 0 END), 0) as refund_costs,

    -- Net
    COALESCE(SUM(bt.amount), 0) as net_profit

FROM brand_transactions bt
GROUP BY bt.brand_id, bt.period_year, bt.period_month;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE inbound_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_entry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_charges ENABLE ROW LEVEL SECURITY;

-- Inbound shipments policies
CREATE POLICY "Brands can view own inbound shipments"
ON inbound_shipments FOR SELECT
USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
));

CREATE POLICY "Admin full access to inbound shipments"
ON inbound_shipments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Outbound shipments policies
CREATE POLICY "Brands can view own outbound shipments"
ON outbound_shipments FOR SELECT
USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
));

CREATE POLICY "Admin full access to outbound shipments"
ON outbound_shipments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Duty rates - everyone can read, admin can write
CREATE POLICY "Anyone can view duty rates"
ON duty_rates FOR SELECT
USING (true);

CREATE POLICY "Admin can manage duty rates"
ON duty_rates FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Duty entries policies
CREATE POLICY "Brands can view own duty entries"
ON duty_entries FOR SELECT
USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
));

CREATE POLICY "Admin full access to duty entries"
ON duty_entries FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Brand transactions policies
CREATE POLICY "Brands can view own transactions"
ON brand_transactions FOR SELECT
USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
));

CREATE POLICY "Admin full access to brand transactions"
ON brand_transactions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Inventory policies
CREATE POLICY "Brands can view own inventory"
ON inventory FOR SELECT
USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
));

CREATE POLICY "Admin full access to inventory"
ON inventory FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Storage charges policies
CREATE POLICY "Brands can view own storage charges"
ON storage_charges FOR SELECT
USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
));

CREATE POLICY "Admin full access to storage charges"
ON storage_charges FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================================================
-- INSERT DEFAULT DUTY RATES (UK 2024 rates)
-- =====================================================
INSERT INTO duty_rates (category, subcategory, rate_type, rate_amount, min_abv, max_abv, effective_from, notes) VALUES
-- Spirits (2024: £31.64 per litre of pure alcohol)
('spirits', NULL, 'per_litre_alcohol', 31.64, 22.00, NULL, '2024-01-01', 'UK Spirits duty 2024'),

-- Wine still (per hectolitre based on ABV bands)
('wine', 'still', 'per_hectolitre', 91.68, 8.5, 15.0, '2024-01-01', 'Still wine 8.5-15% ABV'),
('wine', 'sparkling', 'per_hectolitre', 108.99, 5.5, 8.5, '2024-01-01', 'Sparkling wine 5.5-8.5% ABV'),
('wine', 'sparkling', 'per_hectolitre', 164.43, 8.5, 15.0, '2024-01-01', 'Sparkling wine 8.5-15% ABV'),

-- Beer (per hectolitre based on ABV)
('beer', 'standard', 'per_hectolitre', 21.01, 2.8, 7.5, '2024-01-01', 'Standard beer duty'),

-- RTDs
('rtd', NULL, 'per_hectolitre', 21.01, 4.0, 10.0, '2024-01-01', 'RTD duty rate');

-- =====================================================
-- FUNCTIONS FOR AUTOMATED DUTY CALCULATION
-- =====================================================

-- Function to calculate duty for a product
CREATE OR REPLACE FUNCTION calculate_product_duty(
    p_product_id UUID,
    p_quantity INTEGER
) RETURNS DECIMAL AS $$
DECLARE
    v_category TEXT;
    v_abv DECIMAL;
    v_volume_ml INTEGER;
    v_duty_rate DECIMAL;
    v_total_duty DECIMAL;
BEGIN
    -- Get product details
    SELECT category, abv, volume_ml
    INTO v_category, v_abv, v_volume_ml
    FROM brand_products
    WHERE id = p_product_id;

    -- Find applicable duty rate
    SELECT dr.rate_amount INTO v_duty_rate
    FROM duty_rates dr
    WHERE dr.category = v_category
    AND (dr.min_abv IS NULL OR v_abv >= dr.min_abv)
    AND (dr.max_abv IS NULL OR v_abv <= dr.max_abv)
    AND dr.effective_from <= CURRENT_DATE
    AND (dr.effective_to IS NULL OR dr.effective_to >= CURRENT_DATE)
    ORDER BY dr.effective_from DESC
    LIMIT 1;

    IF v_duty_rate IS NULL THEN
        v_duty_rate := 0;
    END IF;

    -- Calculate based on rate type
    -- For spirits: duty = (volume_ml / 1000) * (abv / 100) * rate * quantity
    -- For wine/beer: duty = (volume_ml / 100000) * rate * quantity (hectolitre = 100L = 100000ml)

    IF v_category = 'spirits' THEN
        v_total_duty := (v_volume_ml::DECIMAL / 1000) * (v_abv / 100) * v_duty_rate * p_quantity;
    ELSE
        v_total_duty := (v_volume_ml::DECIMAL / 100000) * v_duty_rate * p_quantity;
    END IF;

    RETURN ROUND(v_total_duty, 2);
END;
$$ LANGUAGE plpgsql;
