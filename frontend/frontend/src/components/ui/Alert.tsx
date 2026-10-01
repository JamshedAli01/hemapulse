import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

export function Alert({ className, variant = 'default', children, ...props }: AlertProps) {
  const baseStyles = 'relative w-full rounded-lg border p-4 flex items-start gap-3';
  
  const variants = {
    default: 'bg-background text-foreground border-border',
    destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive bg-destructive/10',
    success: 'border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600 bg-green-50',
    warning: 'border-yellow-500/50 text-yellow-800 dark:text-yellow-400 [&>svg]:text-yellow-600 bg-yellow-50',
  };

  const Icon = {
    default: Info,
    destructive: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle,
  }[variant];

  return (
    <div className={cn(baseStyles, variants[variant], className)} role="alert" {...props}>
      <Icon className="h-5 w-5 mt-0.5" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />;
}
