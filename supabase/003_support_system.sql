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
