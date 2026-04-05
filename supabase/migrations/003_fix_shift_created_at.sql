-- Migration to change created_at from TIMESTAMP to DATE in shift tables
-- Created: 2026-04-05

-- Change created_at in shift_summaries
ALTER TABLE shift_summaries 
  ALTER COLUMN created_at TYPE DATE,
  ALTER COLUMN created_at SET DEFAULT CURRENT_DATE;

-- Change created_at in shift_item_sales
ALTER TABLE shift_item_sales 
  ALTER COLUMN created_at TYPE DATE,
  ALTER COLUMN created_at SET DEFAULT CURRENT_DATE;
