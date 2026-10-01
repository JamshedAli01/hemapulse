import { User, MapPin, Droplet, Check, X } from 'lucide-react';
import { MatchOut } from '../../types/matching';
import { Card, CardContent } from '../ui/Card';
import { BloodGroupBadge } from './BloodGroupBadge';
import { AvailabilityBadge } from './AvailabilityBadge';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface MatchCardProps {
  match: MatchOut;
  rank: number;
  onAccept?: () => void;
  onReject?: () => void;
}

export function MatchCard({ match, rank, onAccept, onReject }: MatchCardProps) {
  const isPending = match.status === 'PENDING';

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Rank badge */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
            #{rank}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Name + badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  Donor #{match.donor_id}
                </span>
              </div>
              <BloodGroupBadge value={match.blood_group} />
              <AvailabilityBadge value={match.is_available} />
              <Badge
                variant={
                  match.status === 'ACCEPTED' ? 'default' :
                  match.status === 'REJECTED' ? 'destructive' :
                  'outline'
                }
                className="text-xs"
              >
                {match.status}
              </Badge>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {match.distance_km != null && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {match.distance_km.toFixed(1)} km away
                </span>
              )}
              <span className="flex items-center gap-1">
                <Droplet className="h-3 w-3" />
                {match.blood_group}
              </span>
              <span className="text-muted-foreground/60">
                Match #{match.match_id}
              </span>
            </div>

            {/* Accept / Reject buttons */}
            {isPending && (onAccept || onReject) && (
              <div className="flex gap-2 pt-1">
                {onAccept && (
                  <Button size="sm" variant="primary" onClick={onAccept}>
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Accept
                  </Button>
                )}
                {onReject && (
                  <Button size="sm" variant="outline" onClick={onReject}>
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reject
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
