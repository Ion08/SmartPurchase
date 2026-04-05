'use client';

import { useMemo } from 'react';
import { Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/EmptyState';
import { CSVUploader } from '@/components/CSVUploader';
import { FiscalReportUploader } from '@/components/FiscalReportUploader';
import { useAppStore } from '@/store/useAppStore';
import { useImportMemoryStore } from '@/store/useImportMemoryStore';

export default function ImportPage() {
  const importedRows = useImportMemoryStore((state) => state.importedRows);
  const hasImportedData = useImportMemoryStore((state) => state.hasImportedData);
  const previousImportedRows = useImportMemoryStore((state) => state.previousImportedRows);
  const importHistory = useImportMemoryStore((state) => state.importHistory);
  const rollbackImport = useImportMemoryStore((state) => state.rollbackImport);
  const addActivityEvent = useAppStore((state) => state.addActivityEvent);

  const stats = useMemo(() => {
    const uniqueItems = new Set(importedRows.map((row) => row.item_name)).size;
    const uniqueDates = new Set(importedRows.map((row) => row.date)).size;
    return [
      { label: 'Rows loaded', value: importedRows.length },
      { label: 'Unique items', value: uniqueItems },
      { label: 'Active days', value: uniqueDates }
    ];
  }, [importedRows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="neutral">Client-side CSV parsing</Badge>
        <p className="text-sm text-text-muted">Import, validate, and use data for forecasting.</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            rollbackImport();
            addActivityEvent({
              type: 'import',
              title: 'Import rollback',
              details: 'Reverted to previous imported dataset snapshot.'
            });
          }}
          disabled={previousImportedRows.length === 0}
        >
          <Undo2 className="h-4 w-4" /> Rollback last import
        </Button>
      </div>

      {!hasImportedData ? (
        <EmptyState
          title="No CSV imported yet"
          description="Upload a realistic CSV export from your POS or download the sample file to test the full workflow immediately."
          ctaLabel="Download sample data"
          ctaHref="#uploader"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Imported data summary</CardTitle>
            <CardDescription>The dataset is ready for forecasting, ordering, and analytics.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-border bg-surface-muted p-4">
                <p className="text-sm text-text-muted">{stat.label}</p>
                <p className="mt-2 font-mono text-3xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div id="uploader">
        <CSVUploader />
      </div>

      <div className="border-t border-border pt-6">
        <FiscalReportUploader />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Required columns</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {['date', 'item_name', 'quantity_sold', 'unit', 'stock_current', 'stock_unit', 'cost_per_unit'].map((column) => (
            <div key={column} className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium dark:bg-slate-950">
              {column}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import audit trail</CardTitle>
          <CardDescription>Latest import events with quality score and skipped rows.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {importHistory.length === 0 ? (
            <p className="text-sm text-text-muted">No imports recorded yet.</p>
          ) : (
            importHistory.slice(0, 6).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border bg-surface-muted px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{entry.sourceName}</p>
                  <Badge tone={entry.dataQualityScore >= 85 ? 'success' : entry.dataQualityScore >= 70 ? 'warning' : 'danger'}>
                    Quality {entry.dataQualityScore}%
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {entry.rowsLoaded} rows • dup removed {entry.duplicateRowsRemoved} • invalid skipped {entry.invalidRowsSkipped}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
