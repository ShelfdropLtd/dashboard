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
