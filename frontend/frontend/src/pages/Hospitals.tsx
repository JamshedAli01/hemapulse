import { useState, useEffect, useCallback } from 'react';
import { Building2, RefreshCcw, MapPin, Phone, Mail } from 'lucide-react';
import { hospitalService } from '../services/hospitalService';
import { Hospital } from '../types/hospital';
import { handleApiError } from '../services/apiClient';
import { Spinner } from '../components/ui/Spinner';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardContent } from '../components/ui/Card';

export default function Hospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // The API returns unknown array based on current hospitalService setup, we cast it here for safety
      const data = await hospitalService.listHospitals() as Hospital[];
      setHospitals(data);
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
          <h1 className="text-2xl font-bold tracking-tight">Hospitals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registered hospitals in the network.
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
          <span className="text-sm">Loading hospitals…</span>
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

      {!isLoading && !error && hospitals.length === 0 && (
        <EmptyState
          title="No hospitals found"
          description="There are currently no registered hospitals in the network."
          icon={<Building2 className="h-6 w-6" />}
        />
      )}

      {!isLoading && !error && hospitals.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">{hospitals.length} registered hospital{hospitals.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hospitals.map((hospital) => (
              <Card key={hospital.id}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-semibold text-base leading-tight truncate">{hospital.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{hospital.city}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="text-muted-foreground">
                      {hospital.address}
                    </div>
                    
                    <div className="pt-2 border-t flex flex-col gap-1.5">
                      {hospital.contact_phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{hospital.contact_phone}</span>
                        </div>
                      )}
                      {hospital.contact_email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{hospital.contact_email}</span>
                        </div>
                      )}
                    </div>
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
