import { User, MapPin, Droplet } from 'lucide-react';
import { DonorMatch } from '../../types/matching';
import { Card, CardContent } from '../ui/Card';
import { BloodGroupBadge } from './BloodGroupBadge';
import { AvailabilityBadge } from './AvailabilityBadge';

interface MatchCardProps {
  match: DonorMatch;
  rank: number;
}

export function MatchCard({ match, rank }: MatchCardProps) {
  // Flatten — some backends embed donor info at top level, others nest it
  const name = match.user?.name ?? match.donor?.name;
  const bloodGroup = match.blood_group ?? match.donor?.blood_group;
  const isAvailable = match.is_available ?? match.donor?.is_available;
  const city = match.city ?? match.donor?.city;
  const donorId = match.donor_id;

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
                  {name ?? `Donor #${donorId}`}
                </span>
              </div>
              {bloodGroup && <BloodGroupBadge value={bloodGroup} />}
              <AvailabilityBadge value={isAvailable ?? null} />
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {city}
                </span>
              )}
              {match.distance_km != null && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {match.distance_km.toFixed(1)} km away
                </span>
              )}
              {match.score != null && (
                <span className="flex items-center gap-1">
                  <Droplet className="h-3 w-3" />
                  Score: {typeof match.score === 'number' ? match.score.toFixed(2) : match.score}
                </span>
              )}
              {donorId && (
                <span className="text-muted-foreground/60">ID: {donorId}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
