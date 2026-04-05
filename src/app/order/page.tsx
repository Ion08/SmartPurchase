'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/EmptyState';
import { OrderTable } from '@/components/OrderTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { useImportMemoryStore } from '@/store/useImportMemoryStore';
import { buildMockInventoryRows } from '@/lib/mockData';
import { generateOrderRows } from '@/lib/orderAlgorithm';
import { formatCurrency, formatNumber } from '@/lib/numberFormat';
import { UI_CONSTANTS } from '@/lib/constants';

export default function OrderPage() {
  const importedRows = useImportMemoryStore((state) => state.importedRows);
  const hasImportedData = useImportMemoryStore((state) => state.hasImportedData);
  const addActivityEvent = useAppStore((state) => state.addActivityEvent);
  const threshold = useAppStore((state) => state.profile.stopBuyThreshold);
  const [ready, setReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approvalName, setApprovalName] = useState('');
  const [approvalNote, setApprovalNote] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), UI_CONSTANTS.loadingDelay);
    return () => window.clearTimeout(timeout);
  }, []);

  const rows = hasImportedData && importedRows.length > 0 ? importedRows : buildMockInventoryRows();
  const orderRows = useMemo(() => generateOrderRows(rows, threshold), [rows, threshold]);
  const totalValue = useMemo(() => orderRows.reduce((sum, row) => sum + row.estimated_cost, 0), [orderRows]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
      addActivityEvent({
        type: 'order',
        title: 'Order export',
        details: `Exported order draft worth ${formatCurrency(totalValue)}.`
      });
      toast.success('Print layout opened');
    }
  };

  const handleSend = () => {
    setDialogOpen(true);
  };

  const needsApproval = totalValue >= 1200;
  const canConfirm = !needsApproval || (approvalName.trim().length > 1 && approvalNote.trim().length > 5);

  if (!ready) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-[560px] rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={hasImportedData ? 'success' : 'warning'}>{hasImportedData ? 'Generated from live CSV' : 'Generated from mock inventory'}</Badge>
        <p className="text-sm text-text-muted">Suggestions include safety buffer logic.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Purchase order overview</CardTitle>
            <CardDescription>All rows below are actionable and sorted by urgency.</CardDescription>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-amber-50 px-4 py-3 dark:bg-amber-500/10">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-900/70 dark:text-amber-100/70">Order value</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-amber-950 dark:text-amber-100">{formatCurrency(totalValue)}</p>
            </div>
            <div className="rounded-3xl bg-forest-50 px-4 py-3 dark:bg-forest-900/20">
              <p className="text-xs uppercase tracking-[0.18em] text-forest-800/70 dark:text-forest-100/70">Rows to review</p>
              <p className="mt-1 font-mono text-2xl font-semibold">{formatNumber(orderRows.length)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <OrderTable rows={orderRows} onPrintAction={handlePrint} onSendAction={handleSend} />
        </CardContent>
      </Card>

      {orderRows.length === 0 ? (
        <EmptyState
          title="No order suggested"
          description="Current stock appears sufficient for the next planning window. Import fresh data or lower the stop-buy threshold to reveal pending needs."
          ctaLabel="Review forecast"
          ctaHref="/forecast"
        />
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Send order to supplier"
        description="This action is mocked, but the confirmation flow is fully keyboard accessible."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canConfirm}
              onClick={() => {
                addActivityEvent({
                  type: 'order',
                  title: 'Order sent to supplier',
                  details: `${orderRows.length} items, total ${formatCurrency(totalValue)}${needsApproval ? `, approved by ${approvalName.trim()}` : ''}`
                });
                toast.success('Order sent to supplier successfully');
                setDialogOpen(false);
              }}
            >
              Confirm send
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">SmartPurchase will queue the current order, attach the forecast rationale, and route the request to the selected supplier profile.</p>
          <div className="rounded-3xl border border-border bg-surface-muted p-4">
            <p className="text-sm font-medium">Supplier payload</p>
            <p className="mt-1 text-sm text-text-muted">{orderRows.length} items, {formatCurrency(totalValue)} estimated value, threshold {threshold} days.</p>
          </div>
          {needsApproval ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Approval required for high-value orders</p>
              <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-100/80">Orders above {formatCurrency(1200)} require a reviewer name and a short reason.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Input value={approvalName} onChange={(event) => setApprovalName(event.target.value)} placeholder="Reviewer name" />
                <Input value={approvalNote} onChange={(event) => setApprovalNote(event.target.value)} placeholder="Approval reason" />
              </div>
            </div>
          ) : null}
        </div>
      </Dialog>
    </div>
  );
}
