import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

export interface BloodGroupBadgeProps {
  value?: string | null;
  className?: string;
}

export function BloodGroupBadge({ value, className }: BloodGroupBadgeProps) {
  if (!value) {
    return <Badge variant="outline" className={cn("text-muted-foreground", className)}>Unknown</Badge>;
  }

  // Blood group is typically standard, but since it's a free-form string in the API,
  // we render whatever is passed securely. We use the primary variant to highlight it,
  // as it's the core metric of this application, but keep it clean.
  return (
    <Badge variant="default" className={className}>
      {value.toUpperCase()}
    </Badge>
  );
}
