import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { requestService } from '../services/requestService';
import { hospitalService } from '../services/hospitalService';
import { Hospital } from '../types/hospital';
import { handleApiError } from '../services/apiClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function CreateRequest() {
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<Hospital[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Hospital | null>(null);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const lookupCache = useRef(new Map<string, Hospital[]>());
  const [bloodGroup, setBloodGroup] = useState(BLOOD_GROUPS[0]);
  const [units, setUnits] = useState('1');
  const [requiredBefore, setRequiredBefore] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    hospitalService.listHospitals().then(setHospitals).catch(() => {
      setError('Unable to load hospitals. You can still search for a location.');
    });
  }, []);

  const localMatches = useMemo(() => {
    const query = locationQuery.trim().toLowerCase();
    if (!query) return [];
    return hospitals
      .filter((hospital) =>
        `${hospital.name} ${hospital.address} ${hospital.city}`.toLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [hospitals, locationQuery]);

  const searchLocation = async () => {
    const query = locationQuery.trim();
    if (query.length < 3) {
      setError('Enter at least 3 characters to search for a location.');
      return;
    }
    setError('');
    const cached = lookupCache.current.get(query.toLowerCase());
    if (cached) {
      setLocationResults(cached);
      return;
    }
    setIsSearchingLocation(true);
    try {
      const results = await hospitalService.resolveLocation(query);
      const mapped = results.map((result) => ({
        id: result.hospital_id ?? 0,
        name: result.name,
        address: result.address,
        city: result.city,
        latitude: result.latitude,
        longitude: result.longitude,
      }));
      lookupCache.current.set(query.toLowerCase(), mapped);
      setLocationResults(mapped);
    } catch (err) {
      setLocationResults([]);
      setError(handleApiError(err));
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!selectedLocation || !bloodGroup || !units || !requiredBefore || !description) {
      setError('All fields are required.');
      return;
    }
    const parsedUnits = parseInt(units, 10);
    if (isNaN(parsedUnits) || parsedUnits < 1) {
      setError('Units required must be a positive integer.');
      return;
    }
    setIsSubmitting(true);
    try {
      const hospital = selectedLocation.id
        ? selectedLocation
        : await hospitalService.createHospital({
            name: selectedLocation.name,
            address: selectedLocation.address,
            city: selectedLocation.city || 'Unknown',
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          });
      const created = await requestService.createRequest({
        hospital_id: hospital.id,
        blood_group: bloodGroup,
        units_required: parsedUnits,
        required_before: new Date(requiredBefore).toISOString(),
        description,
        latitude: hospital.latitude,
        longitude: hospital.longitude,
      });
      // Navigate to the newly created request's detail page
      navigate(`/requests/${created.id}`, { state: { created: true } });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back nav */}
      <Link
        to="/requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Requests
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create Blood Request</CardTitle>
          <CardDescription>
            Submit a new emergency blood request. All fields are required by the backend.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Blood group */}
            <div className="space-y-1.5">
              <Label htmlFor="blood-group">Blood Group</Label>
              <Select
                id="blood-group"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                disabled={isSubmitting}
                required
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
            </div>

            {/* Units */}
            <div className="space-y-1.5">
              <Label htmlFor="units">Units Required</Label>
              <Input
                id="units"
                type="number"
                min={1}
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                disabled={isSubmitting}
                required
                placeholder="e.g. 2"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Required Before</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={requiredBefore}
                onChange={(e) => setRequiredBefore(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location">Where is the hospital?</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="location"
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    setSelectedLocation(null);
                    setLocationResults([]);
                  }}
                  disabled={isSubmitting || isSearchingLocation}
                  required
                  placeholder="e.g. Liaquat University Hospital, Hyderabad"
                />
                <Button type="button" variant="outline" onClick={searchLocation} disabled={isSubmitting || isSearchingLocation}>
                  {isSearchingLocation ? 'Searching…' : 'Search'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                We'll use this information to find the hospital's location and connect you with nearby donors.
              </p>
              {(localMatches.length > 0 || locationResults.length > 0) && !selectedLocation && (
                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-sm font-medium">Select a location</p>
                  {[...localMatches, ...locationResults.filter((result) => !localMatches.some((match) => match.name === result.name && match.city === result.city))].map((hospital, index) => (
                    <button
                      type="button"
                      key={`${hospital.name}-${hospital.city}-${index}`}
                      onClick={() => {
                        setSelectedLocation(hospital);
                        setLocationQuery(`${hospital.name}, ${hospital.city}`);
                      }}
                      className="block w-full rounded border p-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="font-medium">{hospital.name}</span>
                      <span className="block text-muted-foreground">{hospital.city || hospital.address}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedLocation && (
                <p className="rounded-md border bg-muted/20 p-3 text-sm">
                  <span className="font-medium">{selectedLocation.name}</span>
                  <span className="block text-muted-foreground">{selectedLocation.city || selectedLocation.address}</span>
                </p>
              )}
              {locationQuery && localMatches.length === 0 && locationResults.length === 0 && !isSearchingLocation && (
                <p className="text-xs text-muted-foreground">Search to find this location.</p>
              )}
              </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                required
                placeholder="Describe the urgency and any relevant clinical details…"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate('/requests')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto sm:ml-auto"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Submit Request
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
