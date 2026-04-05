import Papa from 'papaparse';
import type { Category, InventoryRecord } from '@/types';
import { categoryFromItem, menuItems } from '@/lib/mockData';
import { CSV_CONSTANTS } from '@/lib/constants';

const requiredColumns = CSV_CONSTANTS.requiredColumns;

export interface ParsedCsvResult {
  rows: InventoryRecord[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    rowsLoaded: number;
    duplicateRowsRemoved: number;
    invalidRowsSkipped: number;
    dataQualityScore: number;
  };
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

function toNumber(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : 0;
}

function validateDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  if (date > new Date()) return false; // No future dates
  return true;
}

function validateRow(row: Record<string, string>): string[] {
  const errors: string[] = [];
  const qty = toNumber(row.quantity_sold);
  const cost = toNumber(row.cost_per_unit);
  const stock = toNumber(row.stock_current);
  
  if (!validateDate(row.date)) errors.push('Invalid or future date');
  if (qty < 0) errors.push('Quantity sold cannot be negative');
  if (cost < 0) errors.push('Cost per unit cannot be negative');
  if (stock < 0) errors.push('Stock current cannot be negative');
  if (cost === 0 && row.cost_per_unit !== '') errors.push('Cost per unit cannot be zero');
  
  return errors;
}

function inferCategory(itemName: string): Category {
  return categoryFromItem(itemName);
}

export function parseInventoryCsv(file: File): Promise<ParsedCsvResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (result) => {
        const headers = Object.keys(result.data[0] ?? {}).map(normalizeHeader);
        const missingColumns = requiredColumns.filter((column) => !headers.includes(column));
        const errors: string[] = [];
        const warnings: string[] = [];

        if (missingColumns.length > 0) {
          errors.push(`Missing columns: ${missingColumns.join(', ')}`);
        }

        const candidateRows = result.data.filter((row) => row.date && row.item_name);
        const invalidRowsSkipped = candidateRows.reduce((sum, row) => sum + (validateRow(row).length > 0 ? 1 : 0), 0);
        const validRows = candidateRows.filter((row) => validateRow(row).length === 0);

        if (invalidRowsSkipped > 0) {
          warnings.push(`${invalidRowsSkipped} invalid rows were skipped.`);
        }

        const mappedRows: InventoryRecord[] = validRows
          .map((row) => {
            const item = menuItems.find((entry) => entry.item_name.toLowerCase() === row.item_name.toLowerCase());
            return {
              date: String(row.date),
              item_name: String(row.item_name),
              quantity_sold: toNumber(row.quantity_sold),
              unit: String(row.unit ?? item?.unit ?? ''),
              stock_current: toNumber(row.stock_current),
              stock_unit: String(row.stock_unit ?? item?.stock_unit ?? ''),
              cost_per_unit: toNumber(row.cost_per_unit),
              category: inferCategory(String(row.item_name))
            };
          })
          .filter((row) => Boolean(row.date && row.item_name && row.unit && row.stock_unit));

        const seen = new Set<string>();
        const rows: InventoryRecord[] = [];
        let duplicateRowsRemoved = 0;
        mappedRows.forEach((row) => {
          const key = `${row.date}|${row.item_name.toLowerCase()}|${row.unit.toLowerCase()}`;
          if (seen.has(key)) {
            duplicateRowsRemoved += 1;
            return;
          }
          seen.add(key);
          rows.push(row);
        });

        if (duplicateRowsRemoved > 0) {
          warnings.push(`${duplicateRowsRemoved} duplicate rows were removed.`);
        }

        if (rows.length === 0) {
          errors.push('No valid rows found in the CSV file.');
        }

        const totalRows = result.data.length;
        const qualityLoss = ((invalidRowsSkipped + duplicateRowsRemoved) / Math.max(totalRows, 1)) * 100;
        const dataQualityScore = Math.max(0, Math.min(100, Math.round(100 - qualityLoss)));

        resolve({
          rows,
          errors,
          warnings,
          stats: {
            totalRows,
            rowsLoaded: rows.length,
            duplicateRowsRemoved,
            invalidRowsSkipped,
            dataQualityScore
          }
        });
      },
      error: (error) => {
        resolve({
          rows: [],
          errors: [error.message],
          warnings: [],
          stats: {
            totalRows: 0,
            rowsLoaded: 0,
            duplicateRowsRemoved: 0,
            invalidRowsSkipped: 0,
            dataQualityScore: 0
          }
        });
      }
    });
  });
}
