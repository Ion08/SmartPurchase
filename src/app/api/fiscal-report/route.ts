import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { extractFiscalData, ExtractedFiscalData } from '@/lib/geminiExtractor';

// POST /api/fiscal-report - Process fiscal report with Gemini and save to database
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const restaurantId = formData.get('restaurantId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.txt', '.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, PNG, JPG, GIF, WEBP, TXT, CSV, XLSX, XLS' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract data using Gemini
    let extractedData: ExtractedFiscalData;
    try {
      extractedData = await extractFiscalData(buffer, file.name);
    } catch (error) {
      console.error('Gemini extraction error:', error);
      return NextResponse.json(
        { error: 'Could not process, please try again later' },
        { status: 422 }
      );
    }

    // Step A: Upsert items and collect item IDs
    const itemIdMap = new Map<string, string>();
    
    for (const item of extractedData.items) {
      const normalizedItemName = item.name.toLowerCase().trim();
      
      // Try to find existing item
      const { data: existingItem, error: findError } = await supabase
        .from('items')
        .select('id, item_name')
        .eq('restaurant_id', restaurantId)
        .ilike('item_name', normalizedItemName)
        .is('deleted_at', null)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding item:', findError);
      }

      let itemId: string;
      
      if (existingItem) {
        itemId = existingItem.id;
      } else {
        // Get default category (Dry goods)
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('name', 'Dry goods')
          .single();

        // Create new item
        const { data: newItem, error: insertError } = await supabase
          .from('items')
          .insert({
            restaurant_id: restaurantId,
            item_name: item.name,
            category_id: category?.id,
            unit: 'pcs',
            stock_unit: 'pcs',
            cost_per_unit: item.price_per_unit,
            current_stock: 0,
            avg_daily_sales: 0,
          })
          .select('id')
          .single();

        if (insertError || !newItem) {
          console.error('Error creating item:', insertError);
          continue;
        }
        
        itemId = newItem.id;
      }

      itemIdMap.set(normalizedItemName, itemId);
    }

    // Step B: Record shift summary
    const normalizedTimeBlock = extractedData.time_block.trim();
    
    // Check if a summary already exists for this date/time_block
    const { data: existingSummary } = await supabase
      .from('shift_summaries')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('date', extractedData.date)
      .ilike('time_block', normalizedTimeBlock)
      .single();

    let summaryId: string;

    if (existingSummary) {
      // Update existing summary
      const { data: updatedSummary, error: updateError } = await supabase
        .from('shift_summaries')
        .update({
          total_revenue: extractedData.total_revenue,
          total_transactions: extractedData.transactions,
          source_file: file.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSummary.id)
        .select('id')
        .single();

      if (updateError || !updatedSummary) {
        throw new Error('Failed to update shift summary');
      }
      
      summaryId = updatedSummary.id;
      
      // Clear old item sales for this summary
      await supabase
        .from('shift_item_sales')
        .delete()
        .eq('summary_id', summaryId);
    } else {
      // Create new summary
      const { data: newSummary, error: insertError } = await supabase
        .from('shift_summaries')
        .insert({
          restaurant_id: restaurantId,
          date: extractedData.date,
          time_block: normalizedTimeBlock,
          total_revenue: extractedData.total_revenue,
          total_transactions: extractedData.transactions,
          source_file: file.name,
        })
        .select('id')
        .single();

      if (insertError || !newSummary) {
        throw new Error('Failed to create shift summary');
      }
      
      summaryId = newSummary.id;
    }

    // Step C: Insert itemized sales entries
    const insertedItems = [];
    for (const item of extractedData.items) {
      const normalizedItemName = item.name.toLowerCase().trim();
      const itemId = itemIdMap.get(normalizedItemName);
      
      if (!itemId) {
        console.warn(`Skipping item without ID: ${item.name}`);
        continue;
      }

      const revenue = item.quantity * item.price_per_unit;
      
      const { error: insertError } = await supabase
        .from('shift_item_sales')
        .upsert({
          item_id: itemId,
          summary_id: summaryId,
          quantity_sold: item.quantity,
          revenue: revenue,
        }, {
          onConflict: 'item_id,summary_id',
        });

      if (insertError) {
        console.error('Error inserting shift item sale:', insertError);
      }

      insertedItems.push({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        revenue: revenue,
      });
    }

    // Log activity
    await supabase
      .from('activity_events')
      .insert({
        restaurant_id: restaurantId,
        event_type: 'import',
        title: `Fiscal report imported: ${extractedData.time_block}`,
        details: `${insertedItems.length} items, $${extractedData.total_revenue.toFixed(2)} revenue, ${extractedData.transactions} transactions`,
      });

    // Sort items by quantity for top items
    const topItems = insertedItems
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    return NextResponse.json({
      success: true,
      summary: {
        date: extractedData.date,
        timeBlock: extractedData.time_block,
        totalRevenue: extractedData.total_revenue,
        totalTransactions: extractedData.transactions,
        itemsProcessed: insertedItems.length,
        topItems: topItems,
      },
    });
  } catch (error) {
    console.error('Fiscal report processing error:', error);
    return NextResponse.json(
      { error: 'Could not process, please try again later' },
      { status: 500 }
    );
  }
}
