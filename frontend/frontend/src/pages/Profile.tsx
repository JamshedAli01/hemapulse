import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { donorService } from '../services/donorService';
import { handleApiError } from '../services/apiClient';
import { User, Mail, Phone, Shield, Droplet, Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { DonorProfile } from '../types/donor';
import { useEffect, useCallback } from 'react';

export default function Profile() {
  const { user, logout } = useAuth();
  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(null);
  const [donorLoading, setDonorLoading] = useState(false);
  const [donorError, setDonorError] = useState('');
  const [showDonorForm, setShowDonorForm] = useState(false);
  const [donorFormLoading, setDonorFormLoading] = useState(false);
  const [donorFormError, setDonorFormError] = useState('');

  // Donor form state
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const loadDonorProfile = useCallback(async () => {
    setDonorLoading(true);
    setDonorError('');
    try {
      const profile = await donorService.getMyProfile();
      setDonorProfile(profile);
    } catch {
      // 404 = no profile yet, not an error to display
      setDonorProfile(null);
    } finally {
      setDonorLoading(false);
    }
  }, []);

  useEffect(() => { loadDonorProfile(); }, [loadDonorProfile]);

  const handleCreateDonorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setDonorFormLoading(true);
    setDonorFormError('');
    try {
      await donorService.createProfile({
        blood_group: bloodGroup,
        date_of_birth: dob,
        city,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        is_available: true,
      });
      await loadDonorProfile();
      setShowDonorForm(false);
    } catch (err) {
      setDonorFormError(handleApiError(err));
    } finally {
      setDonorFormLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!donorProfile) return;
    try {
      const updated = await donorService.updateProfile({
        is_available: !donorProfile.is_available,
      });
      setDonorProfile(updated);
    } catch (err) {
      setDonorError(handleApiError(err));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and donor information.</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">Name</p>
                <p>{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">Email</p>
                <p>{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">Phone</p>
                <p>{user?.phone || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">Role</p>
                <p>{user?.role}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <Button variant="destructive" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Donor Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplet className="h-4 w-4" /> Donor Profile
          </CardTitle>
          <CardDescription>
            {donorProfile
              ? 'Your registered donor information.'
              : 'Register as a donor to appear in blood request matches.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {donorLoading && <p className="text-sm text-muted-foreground">Loading donor profile…</p>}

          {donorError && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>{donorError}</AlertDescription>
            </Alert>
          )}

          {!donorLoading && donorProfile && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-red-500" />
                  <span className="font-medium">{donorProfile.blood_group}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{donorProfile.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>DOB: {donorProfile.date_of_birth}</span>
                </div>
                <div>
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${donorProfile.is_eligible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {donorProfile.is_eligible ? 'Eligible' : 'Not Eligible'}
                  </span>
                </div>
              </div>
              <Button
                variant={donorProfile.is_available ? 'outline' : 'primary'}
                size="sm"
                onClick={handleToggleAvailability}
              >
                {donorProfile.is_available ? 'Mark as Unavailable' : 'Mark as Available'}
              </Button>
            </div>
          )}

          {!donorLoading && !donorProfile && !showDonorForm && (
            <Button size="sm" onClick={() => setShowDonorForm(true)}>
              Register as Donor
            </Button>
          )}

          {showDonorForm && (
            <form onSubmit={handleCreateDonorProfile} className="space-y-4 mt-2">
              {donorFormError && (
                <Alert variant="destructive">
                  <AlertDescription>{donorFormError}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="blood-group">Blood Group</Label>
                  <select
                    id="blood-group"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="e.g. Karachi" value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input id="lat" type="number" step="any" placeholder="24.8607" value={lat} onChange={(e) => setLat(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input id="lng" type="number" step="any" placeholder="67.0011" value={lng} onChange={(e) => setLng(e.target.value)} required />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" isLoading={donorFormLoading} disabled={donorFormLoading}>
                  Save Profile
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowDonorForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
