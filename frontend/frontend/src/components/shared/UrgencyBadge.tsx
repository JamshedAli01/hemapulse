import { Badge } from '../ui/Badge';

export interface UrgencyBadgeProps {
  value?: string | null;
  className?: string;
}

export function UrgencyBadge({ value, className }: UrgencyBadgeProps) {
  if (!value) {
    return <Badge variant="outline" className={className}>Unknown Urgency</Badge>;
  }

  const normalized = value.toLowerCase().trim();
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' = 'secondary';

  if (normalized.includes('critical') || normalized.includes('high') || normalized.includes('emergency')) {
    variant = 'destructive';
  } else if (normalized.includes('medium') || normalized.includes('moderate')) {
    variant = 'warning';
  } else if (normalized.includes('low') || normalized.includes('normal') || normalized.includes('routine')) {
    variant = 'success';
  }

  return (
    <Badge variant={variant} className={className}>
      {value}
    </Badge>
  );
}
