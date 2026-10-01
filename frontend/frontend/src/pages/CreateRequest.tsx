import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { requestService } from '../services/requestService';
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

  const [hospitalId, setHospitalId] = useState('');
  const [bloodGroup, setBloodGroup] = useState(BLOOD_GROUPS[0]);
  const [units, setUnits] = useState('1');
  const [requiredBefore, setRequiredBefore] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!hospitalId || !bloodGroup || !units || !requiredBefore || !description || !latitude || !longitude) {
      setError('All fields are required.');
      return;
    }
    const parsedUnits = parseInt(units, 10);
    if (isNaN(parsedUnits) || parsedUnits < 1) {
      setError('Units required must be a positive integer.');
      return;
    }
    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setError('Latitude and longitude must be valid numbers.');
      return;
    }
    const parsedHospitalId = parseInt(hospitalId, 10);
    if (isNaN(parsedHospitalId)) {
      setError('Hospital ID must be a valid number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await requestService.createRequest({
        hospital_id: parsedHospitalId,
        blood_group: bloodGroup,
        units_required: parsedUnits,
        required_before: new Date(requiredBefore).toISOString(),
        description,
        latitude: parsedLat,
        longitude: parsedLng,
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

            {/* Hospital ID */}
            <div className="space-y-1.5">
              <Label htmlFor="hospital-id">Hospital ID</Label>
              <Input
                id="hospital-id"
                type="number"
                min={1}
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                disabled={isSubmitting}
                required
                placeholder="Enter the hospital's numeric ID"
              />
              <p className="text-xs text-muted-foreground">
                The ID of the hospital where blood is needed. Check the{' '}
                <Link to="/hospitals" className="underline hover:no-underline">
                  Hospitals
                </Link>{' '}
                page to find a hospital ID.
              </p>
            </div>

            {/* Location */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Location (Decimal Degrees)</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    disabled={isSubmitting}
                    required
                    placeholder="e.g. 25.3960"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    disabled={isSubmitting}
                    required
                    placeholder="e.g. 68.3578"
                  />
                </div>
              </div>
            </fieldset>

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
