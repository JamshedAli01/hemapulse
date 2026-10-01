import { useState } from 'react';
import { Map, MapPin, Building2, User, Search } from 'lucide-react';
import { matchingService } from '../../services/matchingService';
import { handleApiError } from '../../services/apiClient';
import { MapDataResult } from '../../types/matching';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import { EmptyState } from '../ui/EmptyState';

interface LocationPanelProps {
  requestId: number;
  latitude: number;
  longitude: number;
}

export function LocationPanel({ requestId, latitude, longitude }: LocationPanelProps) {
  const [data, setData] = useState<MapDataResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoadMapData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await matchingService.getMapData(requestId);
      setData(result);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Location Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Geographic distribution of the request, nearby donors, and hospitals.
          </p>
        </div>
        {!data && (
          <Button variant="outline" size="sm" onClick={handleLoadMapData} isLoading={isLoading}>
            <Search className="h-4 w-4 mr-1.5" />
            Load Map Data
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic request location before data is loaded */}
      {!data && !isLoading && !error && (
        <div className="rounded-lg border p-4 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <MapPin className="h-4 w-4 text-destructive" /> Request Coordinates
          </div>
          <p className="text-sm font-medium">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-primary hover:underline"
          >
            Open in Google Maps ↗
          </a>
        </div>
      )}

      {/* Loaded Map Data (List Fallback for Demo) */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Request Info */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-destructive" />
              Target Location
            </h3>
            {data.request_location ? (
              <p className="text-sm">
                Lat: {data.request_location.latitude.toFixed(4)} <br />
                Lng: {data.request_location.longitude.toFixed(4)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No request location provided.</p>
            )}
          </div>

          {/* Nearby Hospitals */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              Nearby Hospitals ({data.hospitals?.length || 0})
            </h3>
            {data.hospitals && data.hospitals.length > 0 ? (
              <ul className="space-y-2">
                {data.hospitals.map((h) => (
                  <li key={h.id} className="text-sm flex justify-between items-start border-b pb-2 last:border-0 last:pb-0">
                    <span className="font-medium">{h.name}</span>
                    {h.distance_km != null && (
                      <span className="text-muted-foreground text-xs">{h.distance_km.toFixed(1)} km</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No hospitals nearby.</p>
            )}
          </div>

          {/* Nearby Donors */}
          <div className="rounded-lg border p-4 space-y-3 md:col-span-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-green-500" />
              Available Donors in Radius ({data.donors?.length || 0})
            </h3>
            {data.donors && data.donors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.donors.map((d) => (
                  <div key={d.id} className="text-sm bg-muted/30 p-2 rounded border flex flex-col">
                    <div className="flex justify-between">
                      <span className="font-medium">Donor #{d.id}</span>
                      {d.blood_group && <span className="font-bold text-destructive">{d.blood_group}</span>}
                    </div>
                    {d.distance_km != null && (
                      <span className="text-muted-foreground text-xs mt-1">{d.distance_km.toFixed(1)} km away</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                title="No donors in area" 
                description="Expand the matching search radius to find more donors."
                icon={<User className="h-6 w-6" />}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
