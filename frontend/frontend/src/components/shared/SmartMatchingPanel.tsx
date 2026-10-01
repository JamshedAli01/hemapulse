import { useState } from 'react';
import { Zap, Users, RefreshCcw } from 'lucide-react';
import { matchingService } from '../../services/matchingService';
import { handleApiError } from '../../services/apiClient';
import { MatchOut } from '../../types/matching';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { MatchCard } from './MatchCard';

type MatchingState = 'idle' | 'loading' | 'done' | 'error';

interface SmartMatchingPanelProps {
  requestId: number;
  /** Blood requests in terminal states don't need matching */
  requestStatus?: string;
}

export function SmartMatchingPanel({ requestId, requestStatus }: SmartMatchingPanelProps) {
  const [state, setState] = useState<MatchingState>('idle');
  const [matches, setMatches] = useState<MatchOut[]>([]);
  const [error, setError] = useState('');

  const isTerminal = requestStatus === 'CANCELLED' || requestStatus === 'FULFILLED';

  const fetchMatches = async () => {
    setState('loading');
    setError('');
    try {
      const result = await matchingService.getMatches(requestId);
      setMatches(result.matches);
      setState('done');
    } catch (err) {
      setError(handleApiError(err));
      setState('error');
    }
  };

  const handleAccept = async (matchId: number) => {
    try {
      await matchingService.acceptMatch(matchId);
      // Refresh to get updated statuses
      await fetchMatches();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleReject = async (matchId: number) => {
    try {
      await matchingService.rejectMatch(matchId);
      await fetchMatches();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  if (isTerminal) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
        Smart matching is not available for {requestStatus?.toLowerCase()} requests.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header + primary action */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Smart Matching
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Find the best available donors for this blood request.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {state === 'idle' && (
            <Button onClick={fetchMatches} size="sm">
              <Zap className="h-4 w-4 mr-1.5" />
              Find Matching Donors
            </Button>
          )}
          {state === 'done' && (
            <Button variant="outline" size="sm" onClick={fetchMatches}>
              <RefreshCcw className="h-4 w-4 mr-1.5" />
              Refresh
            </Button>
          )}
          {state === 'error' && (
            <Button variant="outline" size="sm" onClick={fetchMatches}>
              <RefreshCcw className="h-4 w-4 mr-1.5" />
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Loading */}
      {state === 'loading' && (
        <div className="flex items-center gap-3 py-6 text-muted-foreground">
          <Spinner size="md" />
          <span className="text-sm">Running smart matching algorithm…</span>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {state === 'done' && matches.length === 0 && (
        <EmptyState
          title="No matching donors found"
          description="No available donors matched this request's criteria. Donors are matched by blood group compatibility, proximity, and availability."
          icon={<Users className="h-6 w-6" />}
          action={
            <Button size="sm" variant="outline" onClick={fetchMatches}>
              <RefreshCcw className="h-4 w-4 mr-1.5" />
              Try Again
            </Button>
          }
        />
      )}

      {state === 'done' && matches.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {matches.length} donor{matches.length !== 1 ? 's' : ''} matched · ranked by compatibility
          </p>
          <div className="space-y-2">
            {matches.map((match, i) => (
              <MatchCard
                key={match.match_id}
                match={match}
                rank={i + 1}
                onAccept={() => handleAccept(match.match_id)}
                onReject={() => handleReject(match.match_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Idle prompt */}
      {state === 'idle' && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Zap className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Click <strong>Find Matching Donors</strong> to run the smart matching algorithm.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            The backend will rank donors by blood group compatibility, proximity, and availability.
          </p>
        </div>
      )}
    </div>
  );
}
