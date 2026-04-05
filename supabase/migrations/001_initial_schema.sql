-- Initial schema for SmartPurchase Horeca
-- Created: 2026-04-05

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories lookup table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories from frontend types
INSERT INTO categories (name) VALUES 
  ('Produce'),
  ('Dairy'),
  ('Meat'),
  ('Dry goods'),
  ('Beverages');

-- Restaurants table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('independent', 'chain', 'cloud kitchen')),
  plan VARCHAR(50) NOT NULL DEFAULT 'Basic' CHECK (plan IN ('Basic', 'Pro', 'Chain')),
  location_name VARCHAR(255),
  holiday_region VARCHAR(10) NOT NULL DEFAULT 'MD' CHECK (holiday_region IN ('MD', 'RO', 'GLOBAL')),
  stop_buy_threshold INTEGER NOT NULL DEFAULT 3,
  notifications_email BOOLEAN NOT NULL DEFAULT true,
  notifications_whatsapp BOOLEAN NOT NULL DEFAULT false,
  notifications_low_stock BOOLEAN NOT NULL DEFAULT true,
  notifications_forecast BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Items catalog table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  unit VARCHAR(50) NOT NULL,
  stock_unit VARCHAR(50) NOT NULL,
  cost_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shelf_life_days INTEGER,
  avg_daily_sales DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(restaurant_id, item_name)
);

-- Inventory records table (daily sales/stock data)
CREATE TABLE inventory_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  quantity_sold DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock_current DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, item_id, record_date)
);

-- Activity events table (audit log)
CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('import', 'order', 'settings', 'forecast')),
  title VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Import audits table
CREATE TABLE import_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  source_name VARCHAR(255) NOT NULL,
  rows_loaded INTEGER NOT NULL DEFAULT 0,
  duplicate_rows_removed INTEGER NOT NULL DEFAULT 0,
  invalid_rows_skipped INTEGER NOT NULL DEFAULT 0,
  data_quality_score INTEGER NOT NULL DEFAULT 0 CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forecast views table
CREATE TABLE forecast_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  selected_category VARCHAR(100) NOT NULL DEFAULT 'All categories',
  forecast_mode VARCHAR(50) NOT NULL DEFAULT 'item' CHECK (forecast_mode IN ('item', 'category')),
  focus_item VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'cancelled')),
  total_estimated_cost DECIMAL(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
  forecasted_need DECIMAL(10, 2) NOT NULL DEFAULT 0,
  recommended_order_qty DECIMAL(10, 2) NOT NULL DEFAULT 0,
  estimated_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  priority VARCHAR(10) NOT NULL DEFAULT 'Low' CHECK (priority IN ('High', 'Med', 'Low')),
  stop_buy BOOLEAN NOT NULL DEFAULT false,
  days_of_stock DECIMAL(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holiday cache table
CREATE TABLE holiday_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region VARCHAR(10) NOT NULL CHECK (region IN ('MD', 'RO', 'GLOBAL')),
  holiday_date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  local_name VARCHAR(255),
  country_code VARCHAR(10) NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'api' CHECK (source IN ('api', 'fallback')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(region, holiday_date, name)
);

-- Indexes for performance
CREATE INDEX idx_inventory_records_restaurant_date ON inventory_records(restaurant_id, record_date);
CREATE INDEX idx_inventory_records_item ON inventory_records(item_id);
CREATE INDEX idx_items_restaurant ON items(restaurant_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_activity_events_restaurant ON activity_events(restaurant_id, created_at DESC);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id, order_date DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_holiday_cache_region_date ON holiday_cache(region, holiday_date);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers for tables that need them
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_records_updated_at BEFORE UPDATE ON inventory_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forecast_views_updated_at BEFORE UPDATE ON forecast_views
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies (placeholder - implement with actual auth in Supabase)
-- For now, allow all (to be replaced with proper auth logic)
CREATE POLICY "Allow all" ON restaurants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON inventory_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON activity_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON import_audits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON forecast_views FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON order_items FOR ALL USING (true) WITH CHECK (true);
