import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      toast.error('Action failed');
      console.error(error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button 
            onClick={handleConfirm}
            className={isDangerous ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmLabel}
          </Button>
        </>
      }
            >
              <div className="text-sm text-text-muted">{description}</div>
            </Dialog>
  );
}
