import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { Input } from '../components/ui/Input';
import { User, Mail, Phone, Shield, MapPin, Search } from 'lucide-react';
import { donorService } from '../services/donorService';
import { hospitalService } from '../services/hospitalService';
import { handleApiError } from '../services/apiClient';
import { DonorProfile } from '../types/donor';
import { LocationResult } from '../types/hospital';

export default function Profile() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(null);
  const [donorError, setDonorError] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationSuccess, setLocationSuccess] = useState('');

  const loadDonorProfile = useCallback(async () => {
    if (user?.role !== 'DONOR') return;
    try {
      setDonorProfile(await donorService.getDonor());
    } catch (err) {
      setDonorError(handleApiError(err));
    }
  }, [user?.role]);

  useEffect(() => {
    loadDonorProfile();
  }, [loadDonorProfile]);

  const searchLocation = async () => {
    const query = locationQuery.trim();
    if (query.length < 3) {
      setLocationError('Enter at least 3 characters to search.');
      setLocationResults([]);
      return;
    }
    setLocationLoading(true);
    setLocationError('');
    try {
      setLocationResults(await hospitalService.resolveLocation(query));
    } catch (err) {
      setLocationResults([]);
      setLocationError(handleApiError(err));
    } finally {
      setLocationLoading(false);
    }
  };

  const cancelLocationEdit = () => {
    setEditingLocation(false);
    setLocationQuery('');
    setLocationResults([]);
    setSelectedLocation(null);
    setLocationError('');
  };

  const saveLocation = async () => {
    if (!selectedLocation) {
      setLocationError('Select a location before saving.');
      return;
    }
    setLocationSaving(true);
    setLocationError('');
    setLocationSuccess('');
    try {
      await donorService.updateProfile({
        city: selectedLocation.city || selectedLocation.name,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
      await loadDonorProfile();
      setLocationSuccess('Your donor location was updated.');
      cancelLocationEdit();
    } catch (err) {
      setLocationError(handleApiError(err));
    } finally {
      setLocationSaving(false);
    }
  };

  if (!user) return null;

  const roleLabel: Record<string, string> = {
    ADMIN: 'Administrator',
    REQUESTER: 'Blood Requester',
    DONOR: 'Donor',
    HOSPITAL: 'Hospital',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Your account information.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle>{user.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{roleLabel[user.role] ?? user.role}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <InfoRow icon={<User className="h-4 w-4" />} label="Full Name" value={user.name} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
            {user.phone && <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone} />}
            <InfoRow icon={<Shield className="h-4 w-4" />} label="Role" value={roleLabel[user.role] ?? user.role} />
          </div>
          <Alert variant="default">
            Profile editing is managed by your administrator. Contact support to update your information.
          </Alert>
        </CardContent>
      </Card>

      {user.role === 'DONOR' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" /> Location
            </CardTitle>
            <CardDescription>Use a confirmed Pakistan location so matching can use accurate coordinates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {donorError && <Alert variant="destructive"><AlertDescription>{donorError}</AlertDescription></Alert>}
            {locationSuccess && <Alert variant="success"><AlertDescription>{locationSuccess}</AlertDescription></Alert>}
            {donorProfile && !editingLocation && (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Current location</p>
                  <p className="font-medium">{donorProfile.city}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditingLocation(true)}>
                  Edit location
                </Button>
              </div>
            )}
            {editingLocation && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={locationQuery}
                    onChange={(event) => setLocationQuery(event.target.value)}
                    placeholder="Search city or area"
                    aria-label="Search city or area"
                  />
                  <Button onClick={searchLocation} isLoading={locationLoading} disabled={locationLoading}>
                    <Search className="h-4 w-4 mr-1.5" /> Search
                  </Button>
                </div>
                {locationError && <Alert variant="destructive"><AlertDescription>{locationError}</AlertDescription></Alert>}
                {locationResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Select a location</p>
                    {locationResults.map((result, index) => (
                      <button
                        type="button"
                        key={`${result.latitude}-${result.longitude}-${index}`}
                        onClick={() => setSelectedLocation(result)}
                        className={`w-full rounded-md border p-3 text-left text-sm ${selectedLocation === result ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      >
                        <p className="font-medium">{result.city || result.name}</p>
                        <p className="text-xs text-muted-foreground">{result.address}</p>
                      </button>
                    ))}
                  </div>
                )}
                {selectedLocation && (
                  <div className="rounded-md border bg-muted/20 p-3 text-sm">
                    <p className="font-medium">Confirm location: {selectedLocation.city || selectedLocation.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedLocation.address}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={saveLocation} isLoading={locationSaving} disabled={!selectedLocation || locationSaving}>
                    Save location
                  </Button>
                  <Button variant="outline" onClick={cancelLocationEdit} disabled={locationSaving}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {!showLogoutConfirm ? (
            <Button variant="destructive" onClick={() => setShowLogoutConfirm(true)}>
              Sign Out
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">Are you sure you want to sign out?</p>
              <Button variant="destructive" onClick={logout}>Confirm Sign Out</Button>
              <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm font-medium w-24 shrink-0">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
