import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { type LucideIcon, ChevronRight } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  variant?: 'default' | 'primary';
  className?: string;
}

export function QuickActionCard({ title, description, icon: Icon, href, variant = 'default', className }: QuickActionCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group flex items-center gap-4 rounded-lg border bg-surface p-4 transition-colors hover:bg-muted/50",
        variant === 'primary' && "border-primary/20 hover:border-primary/40",
        className
      )}
    >
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        variant === 'primary' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </Link>
  );
}
