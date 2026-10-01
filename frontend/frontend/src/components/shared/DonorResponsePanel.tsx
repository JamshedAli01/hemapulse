import { useState } from 'react';
import { CheckCircle, XCircle, HeartHandshake } from 'lucide-react';
import { donorResponseService } from '../../services/donorResponseService';
import { handleApiError } from '../../services/apiClient';
import { Button } from '../ui/Button';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';

interface DonorResponsePanelProps {
  requestId: number;
  donorId: number;
  /** Pass request status to hide panel when terminal */
  requestStatus?: string;
}

type ResponseState = 'idle' | 'declining' | 'loading' | 'accepted' | 'declined' | 'error';

export function DonorResponsePanel({ requestId, donorId, requestStatus }: DonorResponsePanelProps) {
  const [state, setState] = useState<ResponseState>('idle');
  const [declineReason, setDeclineReason] = useState('');
  const [error, setError] = useState('');

  const isTerminal = requestStatus === 'CANCELLED' || requestStatus === 'FULFILLED';

  const isLoading = state === 'loading';

  const handleAccept = async () => {
    setState('loading');
    setError('');
    try {
      await donorResponseService.acceptRequest(requestId, { donor_id: donorId });
      setState('accepted');
    } catch (err) {
      setError(handleApiError(err));
      setState('error');
    }
  };

  const handleDeclineSubmit = async () => {
    setState('loading');
    setError('');
    try {
      await donorResponseService.declineRequest(requestId, {
        donor_id: donorId,
        reason: declineReason || undefined,
      });
      setState('declined');
    } catch (err) {
      setError(handleApiError(err));
      setState('error');
    }
  };

  if (isTerminal) return null;

  if (state === 'accepted') {
    return (
      <Alert variant="success">
        <AlertTitle>Response recorded</AlertTitle>
        <AlertDescription>
          You have accepted this blood request. Thank you — your donation can save a life.
        </AlertDescription>
      </Alert>
    );
  }

  if (state === 'declined') {
    return (
      <Alert variant="default">
        <AlertTitle>Response recorded</AlertTitle>
        <AlertDescription>
          You have declined this blood request. Your response has been noted.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <HeartHandshake className="h-5 w-5 text-primary" />
          Your Response
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          You have been matched to this blood request. Please respond at your earliest convenience.
        </p>
      </div>

      {state === 'error' && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Decline form */}
      {state === 'declining' && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="space-y-1.5">
            <Label htmlFor="decline-reason">Reason for declining (optional)</Label>
            <Textarea
              id="decline-reason"
              rows={2}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Not available on this date…"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setState('idle')}>
              Back
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeclineSubmit}
              isLoading={isLoading}
              disabled={isLoading}
            >
              Confirm Decline
            </Button>
          </div>
        </div>
      )}

      {/* Main actions */}
      {(state === 'idle' || state === 'error') && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleAccept} isLoading={isLoading} disabled={isLoading}>
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Accept Request
          </Button>
          <Button
            variant="outline"
            onClick={() => setState('declining')}
            disabled={isLoading}
          >
            <XCircle className="h-4 w-4 mr-1.5" />
            Decline Request
          </Button>
        </div>
      )}
    </div>
  );
}
