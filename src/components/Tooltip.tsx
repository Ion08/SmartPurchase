import { ReactNode, useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="cursor-help"
      >
        {children || <HelpCircle className="h-4 w-4 text-text-muted hover:text-text" />}
      </button>

      {isVisible && (
        <div
          className={`absolute z-50 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-slate-200 dark:text-slate-900 whitespace-nowrap ${positions[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
