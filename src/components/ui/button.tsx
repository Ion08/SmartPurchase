import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
}

const variantClasses = {
  default: 'bg-forest-700 text-white hover:bg-forest-800',
  secondary: 'bg-surface-elevated text-text hover:bg-surface-muted border border-border',
  ghost: 'bg-transparent text-text hover:bg-surface-muted',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-border bg-transparent text-text hover:bg-surface-muted'
};

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-10 px-4 text-base',
  icon: 'h-9 w-9 p-0'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
