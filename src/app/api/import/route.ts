import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// POST /api/import - bulk import inventory records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, records, sourceName } = body;

    if (!restaurantId || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate restaurantId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(restaurantId)) {
      return NextResponse.json(
        { error: 'Invalid restaurantId format. Please initialize your restaurant first.' },
        { status: 400 }
      );
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
      const { data: existingItem, error: findError } = await supabase
        .from('items')
        .select('id, item_name, cost_per_unit')
        .eq('restaurant_id', restaurantId)
        .ilike('item_name', normalizedItemName)
        .single();

      let itemId: string;
      let itemCostPerUnit: number;

      if (existingItem) {
        itemId = existingItem.id;
        itemCostPerUnit = existingItem.cost_per_unit;
      } else {
        // Get default category
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('name', 'Dry goods')
          .single();

        const { data: newItem, error: insertError } = await supabase
          .from('items')
          .insert({
            restaurant_id: restaurantId,
            item_name: normalizedItemName,
            category_id: category?.id,
            unit: unit || 'pcs',
            stock_unit: stockUnit || 'pcs',
            cost_per_unit: costPerUnit || 0,
            current_stock: 0,
            avg_daily_sales: 0,
          })
          .select('id')
          .single();

        if (insertError || !newItem) {
          invalidRowsSkipped++;
          continue;
        }
        
        itemId = newItem.id;
        itemCostPerUnit = costPerUnit || 0;
      }

      // Check for duplicates
      const key = `${restaurantId}|${itemId}|${recordDate}`;
      if (seen.has(key)) {
        duplicateRowsRemoved++;
        continue;
      }
      seen.add(key);

      // Upsert inventory record using upsert
      const { error: upsertError } = await supabase
        .from('inventory_records')
        .upsert({
          restaurant_id: restaurantId,
          item_id: itemId,
          record_date: recordDate,
          quantity_sold: quantitySold || 0,
          stock_current: stockCurrent || 0,
          cost_per_unit: costPerUnit || itemCostPerUnit,
        }, {
          onConflict: 'restaurant_id,item_id,record_date',
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        invalidRowsSkipped++;
        continue;
      }

      rowsLoaded++;
    }

    const totalRows = records.length;
    const qualityLoss = ((invalidRowsSkipped + duplicateRowsRemoved) / Math.max(totalRows, 1)) * 100;
    const dataQualityScore = Math.max(0, Math.min(100, Math.round(100 - qualityLoss)));

    // Create audit log
    const { data: audit, error: auditError } = await supabase
      .from('import_audits')
      .insert({
        restaurant_id: restaurantId,
        source_name: sourceName || 'CSV Import',
        rows_loaded: rowsLoaded,
        duplicate_rows_removed: duplicateRowsRemoved,
        invalid_rows_skipped: invalidRowsSkipped,
        data_quality_score: dataQualityScore,
      })
      .select()
      .single();

    if (auditError) {
      console.error('Audit error:', auditError);
    }

    // Log activity
    await supabase
      .from('activity_events')
      .insert({
        restaurant_id: restaurantId,
        event_type: 'import',
        title: `Imported ${rowsLoaded} records`,
        details: `Quality score: ${dataQualityScore}%`,
      });

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
