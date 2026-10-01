import { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCcw, MapPin, Droplet, CheckCircle2, XCircle } from 'lucide-react';
import { donorService } from '../services/donorService';
import { DonorProfile } from '../types/donor';
import { handleApiError } from '../services/apiClient';
import { Spinner } from '../components/ui/Spinner';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardContent } from '../components/ui/Card';

export default function Donors() {
  const [donors, setDonors] = useState<DonorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await donorService.listAvailableDonors();
      setDonors(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Available Donors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Donors who are currently available and eligible to donate.
          </p>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 py-8 text-muted-foreground">
          <Spinner size="md" />
          <span className="text-sm">Loading donors…</span>
        </div>
      )}

      {!isLoading && error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span>{error}</span>
            <button onClick={load} className="inline-flex items-center gap-1 text-xs underline underline-offset-2">
              <RefreshCcw className="h-3 w-3" /> Retry
            </button>
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && donors.length === 0 && (
        <EmptyState
          title="No available donors"
          description="There are currently no donors marked as available and eligible. Donors can update their availability from their profile."
          icon={<Users className="h-6 w-6" />}
        />
      )}

      {!isLoading && !error && donors.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">{donors.length} available donor{donors.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {donors.map((donor) => (
              <Card key={donor.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                      <Droplet className="h-3.5 w-3.5" />
                      {donor.blood_group}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Available
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{donor.city}</span>
                    </div>
                    {donor.last_donation_date && (
                      <div className="text-xs">
                        Last donation: {new Date(donor.last_donation_date).toLocaleDateString()}
                      </div>
                    )}
                    <div className="text-xs">
                      Donor ID: #{donor.id}
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${donor.is_eligible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {donor.is_eligible ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {donor.is_eligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
