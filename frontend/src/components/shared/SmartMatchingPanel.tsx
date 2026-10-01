import { useState } from 'react';
import { Zap, Users, ChevronDown, RefreshCcw, Square, Bell } from 'lucide-react';
import { matchingService } from '../../services/matchingService';
import { notificationService } from '../../services/notificationService';
import { handleApiError } from '../../services/apiClient';
import { DonorMatch } from '../../types/matching';
import { NotificationChannel } from '../../types/notification';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { MatchCard } from './MatchCard';

type MatchingState = 'idle' | 'loading' | 'done' | 'error';

// Default escalation values from YAML EscalateRequest example
const DEFAULT_CURRENT_RADIUS = 5;
const DEFAULT_NEXT_RADIUS = 10;
const DEFAULT_BATCH_SIZE = 10;

interface SmartMatchingPanelProps {
  requestId: number;
  /** Blood requests in terminal states don't need matching */
  requestStatus?: string;
}

export function SmartMatchingPanel({ requestId, requestStatus }: SmartMatchingPanelProps) {
  const [state, setState] = useState<MatchingState>('idle');
  const [matches, setMatches] = useState<DonorMatch[]>([]);
  const [error, setError] = useState('');
  const [escalating, setEscalating] = useState(false);
  const [escalateError, setEscalateError] = useState('');
  const [stopping, setStopping] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notifyError, setNotifyError] = useState('');

  const isTerminal = requestStatus === 'CANCELLED' || requestStatus === 'FULFILLED';

  const runMatching = async () => {
    setState('loading');
    setError('');
    setStopped(false);
    try {
      const result = await matchingService.runMatching(requestId);
      setMatches(result);
      setState('done');
    } catch (err) {
      setError(handleApiError(err));
      setState('error');
    }
  };

  const refreshMatches = async () => {
    setState('loading');
    setError('');
    try {
      const result = await matchingService.getMatches(requestId);
      setMatches(result);
      setState('done');
    } catch (err) {
      setError(handleApiError(err));
      setState('error');
    }
  };

  const handleEscalate = async () => {
    setEscalating(true);
    setEscalateError('');
    try {
      await matchingService.escalate(requestId, {
        current_radius_km: DEFAULT_CURRENT_RADIUS,
        next_radius_km: DEFAULT_NEXT_RADIUS,
        batch_size: DEFAULT_BATCH_SIZE,
      });
      // Refresh matches after escalation
      await refreshMatches();
    } catch (err) {
      setEscalateError(handleApiError(err));
    } finally {
      setEscalating(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await matchingService.stopMatching(requestId);
      setStopped(true);
    } catch (err) {
      setEscalateError(handleApiError(err));
    } finally {
      setStopping(false);
    }
  };

  const handleNotify = async () => {
    if (matches.length === 0) return;
    setNotifying(true);
    setNotifyError('');
    setNotifySuccess(false);
    try {
      const donorIds = matches.map((m) => m.donor_id).filter((id) => id != null);
      await notificationService.sendNotification(requestId, {
        donor_ids: donorIds,
        channel: NotificationChannel.IN_APP,
      });
      setNotifySuccess(true);
    } catch (err) {
      setNotifyError(handleApiError(err));
    } finally {
      setNotifying(false);
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
            <Button onClick={runMatching} size="sm">
              <Zap className="h-4 w-4 mr-1.5" />
              Find Matching Donors
            </Button>
          )}
          {state === 'done' && !stopped && (
            <>
              <Button variant="outline" size="sm" onClick={refreshMatches}>
                <RefreshCcw className="h-4 w-4 mr-1.5" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEscalate}
                isLoading={escalating}
                disabled={escalating}
              >
                <ChevronDown className="h-4 w-4 mr-1.5" />
                Expand Search
              </Button>
              {matches.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleNotify}
                  isLoading={notifying}
                  disabled={notifying || notifySuccess}
                >
                  <Bell className="h-4 w-4 mr-1.5" />
                  {notifySuccess ? 'Donors Notified' : 'Notify Matching Donors'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStop}
                isLoading={stopping}
                disabled={stopping}
              >
                <Square className="h-4 w-4 mr-1.5" />
                Stop Matching
              </Button>
            </>
          )}
          {state === 'done' && stopped && (
            <Button variant="outline" size="sm" onClick={runMatching}>
              <Zap className="h-4 w-4 mr-1.5" />
              Restart Matching
            </Button>
          )}
          {state === 'error' && (
            <Button variant="outline" size="sm" onClick={runMatching}>
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

      {/* Escalation / action errors */}
      {escalateError && (
        <Alert variant="warning">
          <AlertDescription>{escalateError}</AlertDescription>
        </Alert>
      )}

      {/* Notify success */}
      {notifySuccess && (
        <Alert variant="success">
          <AlertDescription>
            Notifications sent to {matches.length} matched donor{matches.length !== 1 ? 's' : ''} via in-app channel.
          </AlertDescription>
        </Alert>
      )}

      {/* Notify error */}
      {notifyError && (
        <Alert variant="destructive">
          <AlertDescription>{notifyError}</AlertDescription>
        </Alert>
      )}

      {/* Stopped banner */}
      {stopped && (
        <Alert variant="default">
          <AlertDescription>Matching has been stopped. You can restart it at any time.</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {state === 'done' && matches.length === 0 && (
        <EmptyState
          title="No matching donors found"
          description="No available donors matched this request's criteria in the current search radius. Try expanding the search area."
          icon={<Users className="h-6 w-6" />}
          action={
            <Button size="sm" variant="outline" onClick={handleEscalate} isLoading={escalating}>
              <ChevronDown className="h-4 w-4 mr-1.5" />
              Expand Search
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
              <MatchCard key={match.donor_id ?? i} match={match} rank={match.rank ?? i + 1} />
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
