import { useState } from 'react';
import { PackageCheck, QrCode, CheckCircle2 } from 'lucide-react';
import { donationService } from '../../services/donationService';
import { handleApiError } from '../../services/apiClient';
import { Donation, ConfirmationMethod, QRTokenResponse } from '../../types/donation';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { Card, CardContent } from '../ui/Card';

interface DonationPanelProps {
  requestId: number;
  donorId: number;
  requestStatus?: string;
  unitsRemainingCapacity?: number;
  existingDonation?: {
    id: number;
    units: number;
    status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED';
  } | null;
}

type DonationState = 'idle' | 'loading' | 'scheduled' | 'confirming' | 'confirmed' | 'qr_pending' | 'qr_ready' | 'error';

export function DonationPanel({
  requestId,
  donorId,
  requestStatus,
  unitsRemainingCapacity,
  existingDonation = null,
}: DonationPanelProps) {
  const [state, setState] = useState<DonationState>('idle');
  const [donation, setDonation] = useState<Donation | null>(null);
  const [units, setUnits] = useState('1');
  const [confirmMethod, setConfirmMethod] = useState<ConfirmationMethod>(ConfirmationMethod.MANUAL);
  const [qrData, setQrData] = useState<QRTokenResponse | null>(null);
  const [qrToken, setQrToken] = useState('');
  const [error, setError] = useState('');

  const isTerminal = requestStatus === 'CANCELLED' || requestStatus === 'FULFILLED';
  if (isTerminal) return null;
  if (requestStatus === 'EXPIRED') {
    return (
      <Alert variant="default">
        <AlertTitle>Donation scheduling unavailable</AlertTitle>
        <AlertDescription>
          Donation scheduling is unavailable because this request has expired.
        </AlertDescription>
      </Alert>
    );
  }
  const remainingCapacity = unitsRemainingCapacity ?? null;

  const isLoading = state === 'loading';

  const handleSchedule = async () => {
    const parsedUnits = Number.parseInt(units, 10);
    if (!Number.isInteger(parsedUnits) || parsedUnits < 1) {
      setError('Donation units must be a positive whole number.');
      return;
    }
    if (remainingCapacity !== null && parsedUnits > remainingCapacity) {
      setError(`You can schedule at most ${remainingCapacity} unit${remainingCapacity === 1 ? '' : 's'} for this request.`);
      return;
    }
    setState('loading');
    setError('');
    try {
      const created = await donationService.createDonation({
        request_id: requestId,
        donor_id: donorId,
        units: parsedUnits,
      });
      setDonation(created);
      setState('scheduled');
    } catch (err) {
      setError(handleApiError(err));
      setState('error');
    }
  };

  const handleConfirm = async () => {
    if (!donation) return;
    setState('loading');
    setError('');
    try {
      await donationService.confirmDonation(donation.id, { confirmation_method: confirmMethod });
      setState('confirmed');
    } catch (err) {
      setError(handleApiError(err));
      setState('error');
    }
  };

  const handleGenerateQR = async () => {
    if (!donation) return;
    setState('qr_pending');
    setError('');
    try {
      const data = await donationService.generateQR(donation.id);
      setQrData(data);
      setState('qr_ready');
    } catch (err) {
      setError(handleApiError(err));
      setState('scheduled'); // revert
    }
  };

  const handleConfirmQR = async () => {
    if (!qrToken.trim()) {
      setError('Please enter the QR token.');
      return;
    }
    setState('loading');
    setError('');
    try {
      await donationService.confirmQR({ qr_token: qrToken.trim() });
      setState('confirmed');
    } catch (err) {
      setError(handleApiError(err));
      setState('qr_ready');
    }
  };

  // Token value extracted from QR response (backend may use different field names)
  const displayToken = qrData?.qr_token ?? qrData?.token ?? qrData?.qr_code ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-primary" />
          Schedule Donation
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Schedule and confirm your donation for this blood request.
        </p>
      </div>

      {existingDonation?.status === 'SCHEDULED' && (
        <Alert variant="success">
          <AlertTitle>Donation Scheduled</AlertTitle>
          <AlertDescription>
            {existingDonation.units} unit{existingDonation.units !== 1 ? 's' : ''} already scheduled for this request.
            {remainingCapacity !== null && ` ${remainingCapacity} unit${remainingCapacity !== 1 ? 's' : ''} remain available.`}
          </AlertDescription>
        </Alert>
      )}

      {!existingDonation && remainingCapacity === 0 && (
        <Alert>
          <AlertTitle>No additional units available</AlertTitle>
          <AlertDescription>No additional units can be scheduled for this request.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Step 1: Schedule ── */}
      {!existingDonation && remainingCapacity !== 0 && (state === 'idle' || state === 'error') && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="donation-units">Units to donate</Label>
            <Input
              id="donation-units"
              type="number"
              min={1}
              max={remainingCapacity ?? undefined}
              step={1}
              value={units}
              onChange={(event) => {
                const value = event.target.value;
                if (
                  remainingCapacity !== null &&
                  value !== '' &&
                  Number.parseInt(value, 10) > remainingCapacity
                ) {
                  setUnits(String(remainingCapacity));
                  return;
                }
                setUnits(value);
              }}
            />
          </div>
          <Button onClick={handleSchedule} isLoading={isLoading} disabled={isLoading}>
            <PackageCheck className="h-4 w-4 mr-1.5" />
            Schedule Donation
          </Button>
        </div>
      )}

      {/* ── Step 2: Confirm ── */}
      {(state === 'scheduled' || state === 'qr_ready' || state === 'qr_pending') && donation && (
        <div className="space-y-4">
          <Alert variant="success">
            <AlertTitle>Donation #{donation.id} scheduled</AlertTitle>
            <AlertDescription>
              {donation.units} unit{donation.units !== 1 ? 's' : ''} scheduled for Request #{requestId}.
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm font-medium">Confirm Donation</p>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-method">Confirmation Method</Label>
                <Select
                  id="confirm-method"
                  value={confirmMethod}
                  onChange={(e) => setConfirmMethod(e.target.value as ConfirmationMethod)}
                >
                  <option value={ConfirmationMethod.MANUAL}>Manual</option>
                  <option value={ConfirmationMethod.HOSPITAL}>Hospital</option>
                  <option value={ConfirmationMethod.QR}>QR Code</option>
                </Select>
              </div>

              {/* QR flow */}
              {state === 'qr_ready' && qrData && (
                <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <QrCode className="h-4 w-4 text-primary" />
                    QR Token
                  </div>
                  {displayToken && (
                    <code className="block text-xs bg-background border rounded px-3 py-2 font-mono break-all">
                      {displayToken}
                    </code>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="qr-input">Enter token to verify</Label>
                    <Input
                      id="qr-input"
                      value={qrToken}
                      onChange={(e) => setQrToken(e.target.value)}
                      placeholder="Paste QR token here…"
                    />
                  </div>
                  <Button size="sm" onClick={handleConfirmQR} isLoading={isLoading} disabled={isLoading}>
                    Verify & Confirm
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {confirmMethod === ConfirmationMethod.QR && state !== 'qr_ready' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateQR}
                    isLoading={state === 'qr_pending'}
                    disabled={state === 'qr_pending'}
                  >
                    <QrCode className="h-4 w-4 mr-1.5" />
                    Generate QR Token
                  </Button>
                )}
                {confirmMethod !== ConfirmationMethod.QR && (
                  <Button onClick={handleConfirm} isLoading={isLoading} disabled={isLoading}>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Confirm Donation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Step 3: Confirmed ── */}
      {state === 'confirmed' && (
        <Alert variant="success">
          <AlertTitle>Donation Confirmed</AlertTitle>
          <AlertDescription>
            The donation has been successfully confirmed. Thank you for saving a life.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
