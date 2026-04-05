'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Dialog({ open, onOpenChange, title, description, children, footer }: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const lastActiveElement = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (open) {
      lastActiveElement.current = document.activeElement as HTMLElement;
      ref.current?.showModal();
      const focusTarget = ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? ref.current?.querySelector<HTMLElement>('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      focusTarget?.focus();
    } else if (ref.current?.open) {
      ref.current.close();
      lastActiveElement.current?.focus();
    }
  }, [open]);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onOpenChange(false);
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onOpenChange]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <dialog
      ref={ref}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
      className={cn(
        'w-[min(92vw,44rem)] rounded-[2rem] border border-border bg-white p-0 text-text shadow-soft backdrop:bg-slate-950/60 dark:bg-slate-950',
        'open:animate-fadeInUp'
      )}
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      <div className="flex items-start justify-between gap-6 border-b border-border px-6 py-5">
        <div>
          <h2 id="dialog-title" className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          {description ? (
            <p id="dialog-description" className="mt-1 text-sm text-text-muted">
              {description}
            </p>
          ) : null}
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Close dialog" onClick={() => onOpenChange(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
      {footer ? <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-5">{footer}</div> : null}
    </dialog>,
    document.body
  );
}
