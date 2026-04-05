-- Fiscal report schema migration for SmartPurchase Horeca
-- Created: 2026-04-05

-- Shift summaries table - stores time-block sales summaries from fiscal reports
CREATE TABLE shift_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_block VARCHAR(100) NOT NULL, -- Flexible: any time block name from the source data
  total_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  source_file VARCHAR(255),
  created_at DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, date, time_block)
);

-- Shift item sales table - links items to shift summaries with quantities
CREATE TABLE shift_item_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  summary_id UUID NOT NULL REFERENCES shift_summaries(id) ON DELETE CASCADE,
  quantity_sold DECIMAL(10, 2) NOT NULL DEFAULT 0,
  revenue DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at DATE DEFAULT CURRENT_DATE,
  UNIQUE(item_id, summary_id)
);

-- User events table - tracks events that may impact sales
CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  impact_type VARCHAR(50) NOT NULL CHECK (impact_type IN ('positive', 'negative', 'neutral')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_shift_summaries_restaurant_date ON shift_summaries(restaurant_id, date DESC);
CREATE INDEX idx_shift_summaries_time_block ON shift_summaries(time_block);
CREATE INDEX idx_shift_item_sales_summary ON shift_item_sales(summary_id);
CREATE INDEX idx_shift_item_sales_item ON shift_item_sales(item_id);
CREATE INDEX idx_user_events_restaurant_date ON user_events(restaurant_id, date DESC);

-- updated_at trigger for shift_summaries
CREATE TRIGGER update_shift_summaries_updated_at BEFORE UPDATE ON shift_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE shift_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_item_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- For now, allow all (to be replaced with proper auth logic)
CREATE POLICY "Allow all" ON shift_summaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON shift_item_sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON user_events FOR ALL USING (true) WITH CHECK (true);
