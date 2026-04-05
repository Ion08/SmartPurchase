'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ImportAuditEntry, InventoryRecord } from '@/types';

type ImportMemoryState = {
  importedRows: InventoryRecord[];
  previousImportedRows: InventoryRecord[];
  hasImportedData: boolean;
  lastImportedAt: string | null;
  importHistory: ImportAuditEntry[];
  setImportedRows: (rows: InventoryRecord[], meta?: { sourceName?: string; duplicateRowsRemoved?: number; invalidRowsSkipped?: number; dataQualityScore?: number }) => void;
  rollbackImport: () => void;
  resetImport: () => void;
};

export const useImportMemoryStore = create<ImportMemoryState>()(
  persist(
    (set) => ({
      importedRows: [],
      previousImportedRows: [],
      hasImportedData: false,
      lastImportedAt: null,
      importHistory: [],
      setImportedRows: (rows, meta) =>
        set((state) => {
          const historyEntry: ImportAuditEntry | null = rows.length > 0
            ? {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              importedAt: new Date().toISOString(),
              sourceName: meta?.sourceName ?? 'csv-upload',
              rowsLoaded: rows.length,
              duplicateRowsRemoved: meta?.duplicateRowsRemoved ?? 0,
              invalidRowsSkipped: meta?.invalidRowsSkipped ?? 0,
              dataQualityScore: meta?.dataQualityScore ?? 100
            }
            : null;

          return {
            previousImportedRows: state.importedRows,
            importedRows: rows,
            hasImportedData: rows.length > 0,
            lastImportedAt: rows.length > 0 ? new Date().toISOString() : null,
            importHistory: historyEntry ? [historyEntry, ...state.importHistory].slice(0, 25) : state.importHistory
          };
        }),
      rollbackImport: () =>
        set((state) => ({
          importedRows: state.previousImportedRows,
          previousImportedRows: state.importedRows,
          hasImportedData: state.previousImportedRows.length > 0,
          lastImportedAt: state.previousImportedRows.length > 0 ? new Date().toISOString() : null
        })),
      resetImport: () => set({ importedRows: [], previousImportedRows: [], hasImportedData: false, lastImportedAt: null, importHistory: [] })
    }),
    {
      name: 'smartpurchase-import-memory-store'
    }
  )
);