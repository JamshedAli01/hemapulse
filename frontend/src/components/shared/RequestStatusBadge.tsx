import { Badge } from '../ui/Badge';

export interface RequestStatusBadgeProps {
  value?: string | null;
  className?: string;
}

export function RequestStatusBadge({ value, className }: RequestStatusBadgeProps) {
  if (!value) {
    return <Badge variant="outline" className={className}>Unknown Status</Badge>;
  }

  const normalized = value.toLowerCase().trim();
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' = 'secondary';

  if (normalized === 'fulfilled' || normalized === 'completed' || normalized === 'success') {
    variant = 'success';
  } else if (normalized === 'pending' || normalized === 'open' || normalized === 'active') {
    variant = 'warning';
  } else if (normalized === 'cancelled' || normalized === 'closed') {
    variant = 'secondary';
  } else if (normalized === 'urgent' || normalized === 'escalated') {
    variant = 'destructive';
  }

  return (
    <Badge variant={variant} className={className}>
      {value}
    </Badge>
  );
}
