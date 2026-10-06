import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Droplet, MapPin, RefreshCcw, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import { DonorMatch, DonorProfile } from '../types/donor';
import { donorService } from '../services/donorService';
import { handleApiError } from '../services/apiClient';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { BloodGroupBadge } from '../components/shared/BloodGroupBadge';
import { RequestStatusBadge } from '../components/shared/RequestStatusBadge';

export default function Donors() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [matches, setMatches] = useState<DonorMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const donor = await donorService.getDonor();
      const donorMatches = await donorService.listMatches();
      setProfile(donor);
      setMatches(donorMatches);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === UserRole.DONOR) loadData();
    else setIsLoading(false);
  }, [loadData, user?.role]);

  const toggleAvailability = async () => {
    if (!profile) return;
    setIsUpdating(true);
    setError('');
    setSuccess('');
    try {
      const updated = await donorService.updateAvailability({ is_available: !profile.is_available });
      setProfile(updated);
      setSuccess(`You are now ${updated.is_available ? 'available' : 'unavailable'} for donation requests.`);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsUpdating(false);
    }
  };

  if (user?.role !== UserRole.DONOR) {
    return <Alert variant="warning"><AlertDescription>This page is available to donor accounts.</AlertDescription></Alert>;
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Donors</h1><p className="text-muted-foreground">Manage your donor profile and matched requests.</p></div>
      {error && <Alert variant="destructive"><AlertDescription className="flex justify-between gap-3">{error}<button onClick={loadData} className="underline" aria-label="Retry"><RefreshCcw className="h-4 w-4" /></button></AlertDescription></Alert>}
      {success && <Alert variant="success"><AlertDescription>{success}</AlertDescription></Alert>}
      {isLoading && <div className="flex items-center gap-3 py-8 text-muted-foreground"><Spinner /><span>Loading donor information…</span></div>}
      {!isLoading && profile && <>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />My Donor Profile</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div><p className="text-sm text-muted-foreground">Blood group</p><BloodGroupBadge value={profile.blood_group} /></div>
            <div><p className="text-sm text-muted-foreground">City</p><p className="font-medium">{profile.city}</p></div>
            <div><p className="text-sm text-muted-foreground">Eligibility</p><p>{profile.is_eligible ? 'Eligible to donate' : 'Currently not eligible'}</p></div>
            <div className="flex items-end"><Button onClick={toggleAvailability} isLoading={isUpdating} variant={profile.is_available ? 'secondary' : 'primary'}><CheckCircle className="mr-2 h-4 w-4" />{profile.is_available ? 'Mark unavailable' : 'Mark available'}</Button></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Available Matches</CardTitle></CardHeader>
          <CardContent>
            {matches.filter((match) => match.is_active_match).length === 0 ? <EmptyState title="No available matches" description="New eligible matches will appear here." icon={<Droplet className="h-6 w-6" />} /> : <div className="space-y-3">{matches.filter((match) => match.is_active_match).map((match) => <Link key={match.request_id} to={`/requests/${match.request_id}`} className="block rounded-md border p-4 hover:bg-muted/50"><div className="flex flex-wrap items-center gap-2"><BloodGroupBadge value={match.blood_group} /><RequestStatusBadge value={match.request_status} /></div><p className="mt-2 font-medium">{match.hospital} · {match.city}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{match.distance_km != null ? `${match.distance_km.toFixed(1)} km` : 'Distance unavailable'} · {match.units_required} unit{match.units_required === 1 ? '' : 's'}</p></Link>)}</div>}
          </CardContent>
        </Card>
        {matches.some((match) => match.is_committed) && <Card><CardHeader><CardTitle>My Active Commitment</CardTitle></CardHeader><CardContent className="space-y-3">{matches.filter((match) => match.is_committed).map((match) => <Link key={match.request_id} to={`/requests/${match.request_id}`} className="block rounded-md border p-4"><div className="flex items-center gap-2"><BloodGroupBadge value={match.blood_group} /><span className="text-sm font-medium">Request #{match.request_id}</span></div><p className="mt-2 text-sm">{match.hospital} · Donation commitment active</p></Link>)}</CardContent></Card>}
        {matches.some((match) => match.is_history_match) && <Card><CardHeader><CardTitle>Response History</CardTitle></CardHeader><CardContent className="space-y-3">{matches.filter((match) => match.is_history_match).map((match) => <Link key={match.request_id} to={`/requests/${match.request_id}`} className="block rounded-md border p-4"><div className="flex items-center gap-2"><BloodGroupBadge value={match.blood_group} /><RequestStatusBadge value={match.request_status} /></div><p className="mt-2 text-sm">{match.hospital} · {match.request_status === 'EXPIRED' ? 'This request expired' : 'You declined this request'}</p></Link>)}</CardContent></Card>}
      </>}
      {!isLoading && !profile && <EmptyState title="Donor profile not found" description="Your account does not have a donor profile yet. Ask an administrator to create one." icon={<Users className="h-6 w-6" />} />}
    </div>
  );
}
