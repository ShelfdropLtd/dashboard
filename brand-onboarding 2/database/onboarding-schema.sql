-- Run this in Supabase SQL Editor to add onboarding fields to brands table

-- Add approval status
ALTER TABLE brands ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE brands ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Company Details
ALTER TABLE brands ADD COLUMN IF NOT EXISTS legal_company_name TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS trading_name TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS company_number TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS vat_number TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS phone TEXT;

-- Key Contacts
ALTER TABLE brands ADD COLUMN IF NOT EXISTS primary_contact_name TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS primary_contact_email TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS finance_contact_name TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS finance_contact_email TEXT;

-- Bank Details
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_sort_code TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_iban TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_swift TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_country TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_can_receive_gbp BOOLEAN;

-- Compliance & Licensing
ALTER TABLE brands ADD COLUMN IF NOT EXISTS awrs_number TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS license_holder_name TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS uk_compliant_labelling BOOLEAN;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS products_in_bond BOOLEAN;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bond_warehouse_location TEXT;

-- Products
ALTER TABLE brands ADD COLUMN IF NOT EXISTS estimated_sku_count TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS primary_category TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS same_case_size BOOLEAN;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS standard_case_size TEXT;

-- Sales Channels
ALTER TABLE brands ADD COLUMN IF NOT EXISTS sales_channels TEXT[]; -- Array of channels
ALTER TABLE brands ADD COLUMN IF NOT EXISTS territories TEXT[]; -- Array of territories
ALTER TABLE brands ADD COLUMN IF NOT EXISTS amazon_brand_registry TEXT;

-- Commercial Terms
ALTER TABLE brands ADD COLUMN IF NOT EXISTS shelfdrop_tier TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS duty_financing_preference TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS immediate_payment_interest BOOLEAN;

-- Initial Stock & Logistics
ALTER TABLE brands ADD COLUMN IF NOT EXISTS current_stock_location TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS initial_stock_quantity TEXT;

-- Brand Checklist
ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_guidelines_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_logo_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS master_product_sheet_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS declaration_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS declaration_accepted_at TIMESTAMPTZ;

-- Update RLS policies if needed
-- Allow users to update their own brand during onboarding
CREATE POLICY "Users can update their own brand" ON brands
  FOR UPDATE USING (
    id IN (SELECT brand_id FROM users WHERE id = auth.uid())
  );

-- Allow authenticated users to insert new brands (for onboarding)
CREATE POLICY "Authenticated users can create brands" ON brands
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
