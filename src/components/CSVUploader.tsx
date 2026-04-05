'use client';

import { useMemo, useRef, useState } from 'react';
import { Download, FileUp, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { parseInventoryCsv } from '@/lib/csvParser';
import { buildSampleCsv } from '@/lib/mockData';
import { useImportMemoryStore } from '@/store/useImportMemoryStore';
import { useAppStore } from '@/store/useAppStore';
import { CSV_CONSTANTS, UI_CONSTANTS } from '@/lib/constants';
import type { InventoryRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export function CSVUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const setImportedRows = useImportMemoryStore((state) => state.setImportedRows);
  const addActivityEvent = useAppStore((state) => state.addActivityEvent);
  const [previewRows, setPreviewRows] = useState<InventoryRecord[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const sampleCsv = useMemo(() => buildSampleCsv(), []);

  const handleFiles = async (file: File) => {
    // Validate file size
    if (file.size > CSV_CONSTANTS.maxFileSizeBytes) {
      setErrors([`File size too large. Maximum ${CSV_CONSTANTS.maxFileSizeMB}MB allowed.`]);
      toast.error(`File too large (max ${CSV_CONSTANTS.maxFileSizeMB}MB)`);
      return;
    }

    setIsParsing(true);
    setErrors([]);
    setWarnings([]);
    const result = await parseInventoryCsv(file);
    setTimeout(() => {
      setIsParsing(false);
      if (result.errors.length > 0) {
        setErrors(result.errors);
        toast.error(result.errors[0]);
        return;
      }
      setImportedRows(result.rows, {
        sourceName: file.name,
        duplicateRowsRemoved: result.stats.duplicateRowsRemoved,
        invalidRowsSkipped: result.stats.invalidRowsSkipped,
        dataQualityScore: result.stats.dataQualityScore
      });
      setPreviewRows(result.rows.slice(0, CSV_CONSTANTS.previewRowCount));
      setWarnings(result.warnings);
      addActivityEvent({
        type: 'import',
        title: 'CSV import completed',
        details: `${result.stats.rowsLoaded} rows loaded, quality ${result.stats.dataQualityScore}%`
      });
      toast.success(`Data imported successfully — ${result.rows.length} rows loaded`);
      if (result.warnings.length > 0) {
        toast.warning(result.warnings[0]);
      }
    }, UI_CONSTANTS.loadingDelay);
  };

  const downloadSample = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'smartpurchase-sample-data.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Import restaurant data</CardTitle>
          <CardDescription>Upload CSV with sales and stock data.</CardDescription>
        </CardHeader>
        <CardContent>
          <label
            className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-forest-200 bg-forest-50/50 p-5 text-center transition hover:border-forest-500 hover:bg-forest-50 dark:border-forest-700/50 dark:bg-forest-900/10"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files[0];
              if (file) {
                void handleFiles(file);
              }
            }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-forest-700 text-white shadow-soft">
              {isParsing ? <Loader2 className="h-7 w-7 animate-spin" /> : <UploadCloud className="h-7 w-7" />}
            </div>
            <h3 className="mt-4 text-lg font-semibold">Drop your CSV here</h3>
            <p className="mt-1 max-w-lg text-sm text-text-muted">
              Required columns: date, item_name, quantity_sold, unit, stock_current, stock_unit, cost_per_unit.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <Button type="button" onClick={() => inputRef.current?.click()}>
                <FileUp className="h-4 w-4" /> Upload file
              </Button>
              <Button type="button" variant="secondary" onClick={downloadSample}>
                <Download className="h-4 w-4" /> Download sample CSV
              </Button>
            </div>
            <input
              ref={inputRef}
              className="hidden"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleFiles(file);
                }
              }}
            />
          </label>
          {errors.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
              {errors[0]}
            </div>
          ) : null}
          {warnings.length > 0 ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
              {warnings[0]}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>First 10 rows after validation.</CardDescription>
        </CardHeader>
        <CardContent>
          {isParsing ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : previewRows.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="max-h-[360px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white/95 dark:bg-slate-950/95">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, index) => (
                      <TableRow key={`${row.date}-${row.item_name}-${index}`}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.item_name}</TableCell>
                        <TableCell>{row.quantity_sold} {row.unit}</TableCell>
                        <TableCell>{row.stock_current} {row.stock_unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-surface-muted p-8 text-center text-sm text-text-muted">
              Imported rows will appear here once a CSV is loaded.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
