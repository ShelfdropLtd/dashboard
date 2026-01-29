-- Shelfdrop Brand Portal Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (links to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'brand' CHECK (role IN ('brand', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    order_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dispatched', 'delivered', 'cancelled')),
    warehouse TEXT NOT NULL,
    carrier TEXT,
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order lines table
CREATE TABLE IF NOT EXISTS order_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity_cases INTEGER NOT NULL CHECK (quantity_cases > 0),
    case_price DECIMAL(10, 2) NOT NULL CHECK (case_price >= 0),
    line_total DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_cases * case_price) STORED
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    due_date DATE NOT NULL,
    paid_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_brand_id ON users(brand_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_orders_brand_id ON orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_po_number ON orders(po_number);
CREATE INDEX IF NOT EXISTS idx_order_lines_order_id ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_brand_id ON invoices(brand_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's brand_id
CREATE OR REPLACE FUNCTION get_user_brand_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT brand_id FROM users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin' FROM users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on orders
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BRANDS POLICIES
-- ============================================

-- Admins can read all brands
CREATE POLICY "Admins can read all brands" ON brands
    FOR SELECT TO authenticated
    USING (is_admin());

-- Brand users can only read their own brand
CREATE POLICY "Brand users can read own brand" ON brands
    FOR SELECT TO authenticated
    USING (id = get_user_brand_id());

-- Admins can insert brands
CREATE POLICY "Admins can insert brands" ON brands
    FOR INSERT TO authenticated
    WITH CHECK (is_admin());

-- Admins can update brands
CREATE POLICY "Admins can update brands" ON brands
    FOR UPDATE TO authenticated
    USING (is_admin());

-- Admins can delete brands
CREATE POLICY "Admins can delete brands" ON brands
    FOR DELETE TO authenticated
    USING (is_admin());

-- ============================================
-- USERS POLICIES
-- ============================================

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON users
    FOR SELECT TO authenticated
    USING (is_admin());

-- Users can read their own record
CREATE POLICY "Users can read own record" ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Allow insert for new user signup
CREATE POLICY "Enable insert for signup" ON users
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- Admins can update any user
CREATE POLICY "Admins can update any user" ON users
    FOR UPDATE TO authenticated
    USING (is_admin());

-- Users can update their own record (limited fields handled by app)
CREATE POLICY "Users can update own record" ON users
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

-- ============================================
-- ORDERS POLICIES
-- ============================================

-- Admins can read all orders
CREATE POLICY "Admins can read all orders" ON orders
    FOR SELECT TO authenticated
    USING (is_admin());

-- Brand users can read their own orders
CREATE POLICY "Brand users can read own orders" ON orders
    FOR SELECT TO authenticated
    USING (brand_id = get_user_brand_id());

-- Admins can insert orders
CREATE POLICY "Admins can insert orders" ON orders
    FOR INSERT TO authenticated
    WITH CHECK (is_admin());

-- Admins can update orders
CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE TO authenticated
    USING (is_admin());

-- Admins can delete orders
CREATE POLICY "Admins can delete orders" ON orders
    FOR DELETE TO authenticated
    USING (is_admin());

-- ============================================
-- ORDER LINES POLICIES
-- ============================================

-- Admins can read all order lines
CREATE POLICY "Admins can read all order lines" ON order_lines
    FOR SELECT TO authenticated
    USING (is_admin());

-- Brand users can read order lines for their orders
CREATE POLICY "Brand users can read own order lines" ON order_lines
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_lines.order_id
            AND orders.brand_id = get_user_brand_id()
        )
    );

-- Admins can insert order lines
CREATE POLICY "Admins can insert order lines" ON order_lines
    FOR INSERT TO authenticated
    WITH CHECK (is_admin());

-- Admins can update order lines
CREATE POLICY "Admins can update order lines" ON order_lines
    FOR UPDATE TO authenticated
    USING (is_admin());

-- Admins can delete order lines
CREATE POLICY "Admins can delete order lines" ON order_lines
    FOR DELETE TO authenticated
    USING (is_admin());

-- ============================================
-- INVOICES POLICIES
-- ============================================

-- Admins can read all invoices
CREATE POLICY "Admins can read all invoices" ON invoices
    FOR SELECT TO authenticated
    USING (is_admin());

-- Brand users can read their own invoices
CREATE POLICY "Brand users can read own invoices" ON invoices
    FOR SELECT TO authenticated
    USING (brand_id = get_user_brand_id());

-- Admins can insert invoices
CREATE POLICY "Admins can insert invoices" ON invoices
    FOR INSERT TO authenticated
    WITH CHECK (is_admin());

-- Admins can update invoices
CREATE POLICY "Admins can update invoices" ON invoices
    FOR UPDATE TO authenticated
    USING (is_admin());

-- Admins can delete invoices
CREATE POLICY "Admins can delete invoices" ON invoices
    FOR DELETE TO authenticated
    USING (is_admin());

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample brand
-- INSERT INTO brands (name, contact_email) VALUES
-- ('Sample Spirits Co', 'contact@samplespirits.com'),
-- ('Craft Beverages Ltd', 'hello@craftbev.co.uk');

-- Note: Users are created through Supabase Auth signup flow
-- Admin users need to be manually set via SQL:
-- UPDATE users SET role = 'admin' WHERE email = 'admin@shelfdrop.co';
