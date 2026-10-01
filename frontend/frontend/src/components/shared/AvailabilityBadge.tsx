import { Badge } from '../ui/Badge';

export interface AvailabilityBadgeProps {
  value?: boolean | null;
  className?: string;
}

export function AvailabilityBadge({ value, className }: AvailabilityBadgeProps) {
  if (value === undefined || value === null) {
    return <Badge variant="outline" className={className}>Unknown Availability</Badge>;
  }

  return (
    <Badge variant={value ? 'success' : 'secondary'} className={className}>
      {value ? 'Available' : 'Unavailable'}
    </Badge>
  );
}
