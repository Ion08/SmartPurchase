'use client';

import { useRef, useState } from 'react';
import { FileText, Loader2, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ShiftSummary {
  date: string;
  totalRevenue: number;
  totalTransactions: number;
  itemsProcessed: number;
  topItems: Array<{
    name: string;
    category: string;
    quantity: number;
    revenue: number;
  }>;
}

export function FiscalReportUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const restaurantId = useAppStore((state) => state.restaurantId);
  const addActivityEvent = useAppStore((state) => state.addActivityEvent);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (file: File) => {
    // Check if restaurant is initialized
    if (!restaurantId) {
      setError('Restaurant initialization in progress. Please wait and try again.');
      toast.error('Restaurant not initialized');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Maximum 10MB allowed.');
      toast.error('File too large (max 10MB)');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('restaurantId', restaurantId);

      const response = await fetch('/api/fiscal-report', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process fiscal report');
      }

      setSummary(result.summary);
      
      addActivityEvent({
        type: 'import',
        title: `Fiscal report imported`,
        details: `${result.summary.itemsProcessed} items, $${result.summary.totalRevenue.toFixed(2)} revenue`
      });

      toast.success(`Fiscal report processed - ${result.summary.itemsProcessed} items extracted`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process file';
      setError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Import fiscal report</CardTitle>
          <CardDescription>
            Upload a fiscal report (PDF, image, CSV, Excel, or text) to extract sales data by time block using AI.
          </CardDescription>
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
              {isProcessing ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <FileText className="h-7 w-7" />
              )}
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {isProcessing ? 'Processing with AI...' : 'Drop your fiscal report here'}
            </h3>
            <p className="mt-1 max-w-lg text-sm text-text-muted">
              {isProcessing 
                ? 'Gemini AI is extracting itemized sales data from your report. This may take a few seconds.'
                : 'Supports PDF, PNG, JPG, GIF, WEBP, CSV, XLSX, XLS, and TXT files. Max 10MB.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <Button 
                type="button" 
                onClick={() => inputRef.current?.click()}
                disabled={isProcessing}
              >
                <UploadCloud className="h-4 w-4" /> 
                {isProcessing ? 'Processing...' : 'Upload report'}
              </Button>
            </div>
            <input
              ref={inputRef}
              className="hidden"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.csv,.xlsx,.xls,.txt,application/pdf,image/*,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleFiles(file);
                }
              }}
            />
          </label>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Shift Snapshot</CardTitle>
          <CardDescription>
            {summary 
              ? 'Summary of extracted sales data from your fiscal report.'
              : 'Import a fiscal report to see the extracted shift summary here.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="space-y-4">
              <div className="h-20 animate-pulse rounded-xl bg-surface-muted" />
              <div className="h-32 animate-pulse rounded-xl bg-surface-muted" />
            </div>
          ) : summary ? (
            <div className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-surface-muted p-3">
                  <p className="text-xs text-text-muted">Total Revenue</p>
                  <p className="font-mono text-lg font-semibold">
                    ${summary.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-muted p-3">
                  <p className="text-xs text-text-muted">Transactions</p>
                  <p className="font-mono text-lg font-semibold">
                    {summary.totalTransactions}
                  </p>
                </div>
              </div>

              {/* Top Items */}
              {summary.topItems.length > 0 && (
                <div className="rounded-xl border border-border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <p className="text-sm font-medium">Top {Math.min(3, summary.topItems.length)} Items</p>
                  </div>
                  <div className="space-y-2">
                    {summary.topItems.map((item, index) => (
                      <div 
                        key={`${item.name}-${index}`}
                        className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest-100 text-xs font-medium text-forest-700 dark:bg-forest-800 dark:text-forest-200">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-text-muted">{item.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{item.quantity} sold</p>
                          <p className="text-xs text-text-muted">${item.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Badge tone="success" className="w-full justify-center">
                {summary.itemsProcessed} items saved to database
              </Badge>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-surface-muted p-8 text-center text-sm text-text-muted">
              <FileText className="mx-auto mb-3 h-8 w-8 opacity-50" />
              <p>No fiscal report processed yet.</p>
              <p className="mt-1 text-xs">Upload a report to see AI-extracted data.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
