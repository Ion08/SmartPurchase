import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';

// POST /api/import - bulk import inventory records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, records, sourceName } = body;

    if (!restaurantId || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let rowsLoaded = 0;
    let duplicateRowsRemoved = 0;
    let invalidRowsSkipped = 0;
    const seen = new Set<string>();

    for (const record of records) {
      const { itemName, recordDate, quantitySold, stockCurrent, costPerUnit, unit, stockUnit } = record as {
        itemName?: string;
        recordDate?: string;
        quantitySold?: number;
        stockCurrent?: number;
        costPerUnit?: number;
        unit?: string;
        stockUnit?: string;
      };

      if (!itemName || !recordDate) {
        invalidRowsSkipped++;
        continue;
      }

      const normalizedItemName = itemName.toLowerCase().trim();

      // Find or create item (case-insensitive)
      let item = await queryOne(
        `SELECT * FROM items WHERE restaurant_id = $1 AND LOWER(item_name) = LOWER($2)`,
        [restaurantId, normalizedItemName]
      );

      if (!item) {
        // Get or create default category
        let category = await queryOne(`SELECT * FROM categories WHERE name = 'Dry goods'`);
        if (!category) {
          category = await queryOne(
            `INSERT INTO categories (name) VALUES ('Dry goods') RETURNING *`
          );
        }

        item = await queryOne(
          `INSERT INTO items (restaurant_id, item_name, category_id, unit, stock_unit, cost_per_unit, current_stock, avg_daily_sales)
           VALUES ($1, $2, $3, $4, $5, $6, 0, 0) RETURNING *`,
          [restaurantId, normalizedItemName, category.id, unit || 'pcs', stockUnit || 'pcs', costPerUnit || 0]
        );
      }

      // Check for duplicates
      const key = `${restaurantId}|${item.id}|${recordDate}`;
      if (seen.has(key)) {
        duplicateRowsRemoved++;
        continue;
      }
      seen.add(key);

      // Upsert inventory record
      const updateResult = await queryOne(
        `UPDATE inventory_records 
         SET quantity_sold = $4, stock_current = $5, cost_per_unit = $6, updated_at = NOW()
         WHERE restaurant_id = $1 AND item_id = $2 AND record_date = $3
         RETURNING *`,
        [restaurantId, item.id, recordDate, quantitySold || 0, stockCurrent || 0, costPerUnit || item.cost_per_unit]
      );

      if (!updateResult) {
        await queryOne(
          `INSERT INTO inventory_records (restaurant_id, item_id, record_date, quantity_sold, stock_current, cost_per_unit)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [restaurantId, item.id, recordDate, quantitySold || 0, stockCurrent || 0, costPerUnit || item.cost_per_unit]
        );
      }

      rowsLoaded++;
    }

    const totalRows = records.length;
    const qualityLoss = ((invalidRowsSkipped + duplicateRowsRemoved) / Math.max(totalRows, 1)) * 100;
    const dataQualityScore = Math.max(0, Math.min(100, Math.round(100 - qualityLoss)));

    // Create audit log
    const audit = await queryOne(
      `INSERT INTO import_audits (restaurant_id, source_name, rows_loaded, duplicate_rows_removed, invalid_rows_skipped, data_quality_score)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [restaurantId, sourceName || 'CSV Import', rowsLoaded, duplicateRowsRemoved, invalidRowsSkipped, dataQualityScore]
    );

    // Log activity
    await queryOne(
      `INSERT INTO activity_events (restaurant_id, event_type, title, details)
       VALUES ($1, $2, $3, $4)`,
      [restaurantId, 'import', `Imported ${rowsLoaded} records`, `Quality score: ${dataQualityScore}%`]
    );

    return NextResponse.json({
      audit,
      stats: {
        totalRows,
        rowsLoaded,
        duplicateRowsRemoved,
        invalidRowsSkipped,
        dataQualityScore
      }
    });
  } catch (error) {
    console.error('Import POST error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
