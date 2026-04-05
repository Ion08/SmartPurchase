'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { OrderRow } from '@/types';
import { formatCurrency } from '@/lib/numberFormat';

type SortField = 'item_name' | 'priority' | 'estimated_cost' | 'current_stock';
type SortOrder = 'asc' | 'desc';

export function OrderTable({ rows, onPrintAction, onSendAction }: { rows: OrderRow[]; onPrintAction: () => void; onSendAction: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredAndSortedRows = useMemo(() => {
    let result = rows.filter((row) =>
      row.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'item_name':
          aVal = a.item_name.toLowerCase();
          bVal = b.item_name.toLowerCase();
          break;
        case 'priority':
          const priorityMap = { 'High': 3, 'Med': 2, 'Low': 1 };
          aVal = priorityMap[a.priority as keyof typeof priorityMap] || 0;
          bVal = priorityMap[b.priority as keyof typeof priorityMap] || 0;
          break;
        case 'estimated_cost':
          aVal = a.estimated_cost;
          bVal = b.estimated_cost;
          break;
        case 'current_stock':
          aVal = a.current_stock;
          bVal = b.current_stock;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [rows, searchTerm, sortField, sortOrder]);

  const total = useMemo(() => filteredAndSortedRows.reduce((sum, row) => sum + row.estimated_cost, 0), [filteredAndSortedRows]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Order suggestion</CardTitle>
            <CardDescription>Generated from forecast and current stock.</CardDescription>
          </div>
          <div className="rounded-xl bg-surface-muted px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Estimated order value</p>
            <p className="mt-1 font-mono text-xl font-semibold text-text">{formatCurrency(total)}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-surface-muted px-3 py-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search items by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 bg-transparent px-2 py-1 focus:outline-none focus:ring-0"
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button onClick={() => toggleSort('item_name')} className="flex items-center gap-2 hover:text-text">
                        Item {sortField === 'item_name' && <ArrowUpDown className="h-3 w-3" />}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort('current_stock')} className="flex items-center gap-2 hover:text-text">
                        Current stock {sortField === 'current_stock' && <ArrowUpDown className="h-3 w-3" />}
                      </button>
                    </TableHead>
                    <TableHead>Forecasted need</TableHead>
                    <TableHead>Recommended</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort('estimated_cost')} className="flex items-center gap-2 hover:text-text">
                        Estimated cost {sortField === 'estimated_cost' && <ArrowUpDown className="h-3 w-3" />}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort('priority')} className="flex items-center gap-2 hover:text-text">
                        Priority {sortField === 'priority' && <ArrowUpDown className="h-3 w-3" />}
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedRows.map((row) => (
                    <TableRow key={row.item_name}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-text">{row.item_name}</span>
                          <div className="flex flex-wrap items-center gap-2">
                            {row.stop_buy ? <Badge tone="danger">Stop-buy</Badge> : null}
                            <span className="text-xs text-text-muted">{row.category}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{row.current_stock.toFixed(1)}</TableCell>
                      <TableCell>{row.forecasted_need.toFixed(1)}</TableCell>
                      <TableCell>{row.recommended_order_qty.toFixed(1)}</TableCell>
                      <TableCell>{row.unit}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(row.estimated_cost)}</TableCell>
                      <TableCell>
                        <Badge tone={row.priority === 'High' ? 'danger' : row.priority === 'Med' ? 'warning' : 'success'}>{row.priority}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="secondary" onClick={onPrintAction}>Export Order to PDF</Button>
            <Button onClick={onSendAction}>Send to Supplier</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
