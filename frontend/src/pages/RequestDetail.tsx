import { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Droplet, Clock, MapPin, Building2, RefreshCcw, AlertTriangle } from 'lucide-react';
import { useRequest } from '../hooks/useRequests';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import { requestService } from '../services/requestService';
import { handleApiError } from '../services/apiClient';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { BloodGroupBadge } from '../components/shared/BloodGroupBadge';
import { UrgencyBadge } from '../components/shared/UrgencyBadge';
import { RequestStatusBadge } from '../components/shared/RequestStatusBadge';
import { SmartMatchingPanel } from '../components/shared/SmartMatchingPanel';
import { DonorResponsePanel } from '../components/shared/DonorResponsePanel';
import { DonationPanel } from '../components/shared/DonationPanel';
import { AiAnalysisPanel } from '../components/shared/AiAnalysisPanel';
import { LocationPanel } from '../components/shared/LocationPanel';

function formatDateTime(dt: string): string {
  try {
    return new Date(dt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });
  } catch {
    return dt;
  }
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-border last:border-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{children}</dd>
    </div>
  );
}

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();

  const numericId = parseInt(id ?? '', 10);
  const { request, isLoading, error, refetch } = useRequest(numericId);

  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const justCreated = (location.state as { created?: boolean } | null)?.created;

  const handleCancel = async () => {
    if (!cancelConfirm) {
      setCancelConfirm(true);
      return;
    }
    setCancelLoading(true);
    setCancelError('');
    try {
      await requestService.cancelRequest(numericId);
      refetch();
      setCancelConfirm(false);
    } catch (err) {
      setCancelError(handleApiError(err));
    } finally {
      setCancelLoading(false);
    }
  };

  if (isNaN(numericId)) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>Invalid request ID.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back nav */}
      <Link
        to="/requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Requests
      </Link>

      {/* Success banner when just created */}
      {justCreated && (
        <Alert variant="success">
          <AlertTitle>Request created</AlertTitle>
          <AlertDescription>Your blood request has been submitted successfully.</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-3 py-12 text-muted-foreground">
          <Spinner size="lg" />
          <span className="text-sm">Loading request details…</span>
        </div>
      )}

      {/* Fetch error */}
      {!isLoading && error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span>{error}</span>
            <button
              onClick={refetch}
              className="inline-flex items-center gap-1 text-xs underline underline-offset-2"
            >
              <RefreshCcw className="h-3 w-3" /> Retry
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Detail card */}
      {!isLoading && !error && request && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <BloodGroupBadge value={request.blood_group} />
                {request.urgency && <UrgencyBadge value={request.urgency} />}
                {request.status && <RequestStatusBadge value={request.status} />}
              </div>
              <CardTitle className="text-lg">Request #{request.id}</CardTitle>
            </CardHeader>

            <CardContent>
              <dl className="space-y-0">
                <InfoRow label="Description">
                  {request.description || <span className="text-muted-foreground italic">None</span>}
                </InfoRow>

                <InfoRow label="Units Required">
                  <span className="inline-flex items-center gap-1.5">
                    <Droplet className="h-4 w-4 text-primary" />
                    {request.units_required} unit{request.units_required !== 1 ? 's' : ''}
                  </span>
                </InfoRow>

                <InfoRow label="Required Before">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatDateTime(request.required_before)}
                  </span>
                </InfoRow>

                <InfoRow label="Target Location">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {request.hospital ? (
                      <>
                        <span>{request.hospital.name}</span>
                        {request.hospital.city && <span className="text-muted-foreground">· {request.hospital.city}</span>}
                      </>
                    ) : (
                      <span className="text-muted-foreground italic">Location details unavailable</span>
                    )}
                  </span>
                </InfoRow>

                {request.hospital && (
                  <InfoRow label="Hospital">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {request.hospital.name}
                      {request.hospital.city && ` · ${request.hospital.city}`}
                    </span>
                  </InfoRow>
                )}

                {!request.hospital && (
                  <InfoRow label="Hospital ID">#{request.hospital_id}</InfoRow>
                )}

                {request.verified != null && (
                  <InfoRow label="Verified">
                    {request.verified ? 'Yes' : 'Not yet verified'}
                  </InfoRow>
                )}

                {request.notes && (
                  <InfoRow label="Notes">{request.notes}</InfoRow>
                )}

                {request.created_at && (
                  <InfoRow label="Submitted">{formatDateTime(request.created_at)}</InfoRow>
                )}
              </dl>

              {/* Cancel action */}
              {cancelError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{cancelError}</AlertDescription>
                </Alert>
              )}

              {request.status !== 'CANCELLED' && request.status !== 'FULFILLED' && (
                <div className="mt-6 pt-4 border-t border-border flex flex-col gap-2 sm:flex-row sm:items-center">
                  {cancelConfirm && (
                    <p className="flex items-center gap-1.5 text-sm text-yellow-700">
                      <AlertTriangle className="h-4 w-4" />
                      Are you sure? This cannot be undone.
                    </p>
                  )}
                  <div className="flex gap-2 sm:ml-auto">
                    {cancelConfirm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancelConfirm(false)}
                        disabled={cancelLoading}
                      >
                        Keep Request
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCancel}
                      isLoading={cancelLoading}
                      disabled={cancelLoading}
                    >
                      {cancelConfirm ? 'Confirm Cancel' : 'Cancel Request'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── AI Analysis (Optional/All) ── */}
          <Card>
            <CardContent className="pt-6">
              <AiAnalysisPanel 
                requestId={request.id} 
                description={request.description} 
              />
            </CardContent>
          </Card>

          {/* ── Location & Map ── */}
          {request.latitude != null && request.longitude != null && (
            <Card>
              <CardContent className="pt-6">
                <LocationPanel 
                  requestId={request.id} 
                  latitude={request.latitude} 
                  longitude={request.longitude} 
                />
              </CardContent>
            </Card>
          )}

          {/* ── Smart Matching ── */}
          <Card>
            <CardContent className="pt-6">
              <SmartMatchingPanel
                requestId={request.id}
                requestStatus={request.status}
              />
            </CardContent>
          </Card>

          {/* ── Donor Response (DONOR only) ── */}
          {user?.role === UserRole.DONOR && user.id && (
            <Card>
              <CardContent className="pt-6">
                <DonorResponsePanel
                  requestId={request.id}
                  donorId={user.id}
                  requestStatus={request.status}
                />
              </CardContent>
            </Card>
          )}

          {/* ── Donation / Fulfillment (DONOR + HOSPITAL) ── */}
          {(user?.role === UserRole.DONOR || user?.role === UserRole.HOSPITAL) && user.id && (
            <Card>
              <CardContent className="pt-6">
                <DonationPanel
                  requestId={request.id}
                  donorId={user.id}
                  requestStatus={request.status}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
