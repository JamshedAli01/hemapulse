import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Droplet, MapPin, RefreshCcw, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import { DonorProfile } from '../types/donor';
import { BloodRequest } from '../types/request';
import { donorService } from '../services/donorService';
import { notificationService } from '../services/notificationService';
import { requestService } from '../services/requestService';
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
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const donor = await donorService.getDonor();
      const notifications = await notificationService.listNotifications();
      const ids = [...new Set(notifications.map((item) => item.request_id).filter((id): id is number => typeof id === 'number'))];
      const loadedRequests = await Promise.all(ids.map((id) => requestService.getRequest(id)));
      setProfile(donor);
      setRequests(loadedRequests);
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
          <CardHeader><CardTitle>Relevant Blood Requests</CardTitle></CardHeader>
          <CardContent>
            {requests.length === 0 ? <EmptyState title="No matched requests" description="You will see requests here when the system notifies you of a match." icon={<Droplet className="h-6 w-6" />} /> : <div className="space-y-3">{requests.map((request) => <Link key={request.id} to={`/requests/${request.id}`} className="block rounded-md border p-4 hover:bg-muted/50"><div className="flex flex-wrap items-center gap-2"><BloodGroupBadge value={request.blood_group} /><RequestStatusBadge value={request.status} /></div><p className="mt-2 text-sm">{request.description}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />Hospital #{request.hospital_id} · {request.units_required} unit{request.units_required === 1 ? '' : 's'}</p></Link>)}</div>}
            <p className="mt-4 text-xs text-muted-foreground">Accept/decline actions are not available in the deployed backend donor API; open a request for details.</p>
          </CardContent>
        </Card>
      </>}
      {!isLoading && !profile && <EmptyState title="Donor profile not found" description="Your account does not have a donor profile yet. Ask an administrator to create one." icon={<Users className="h-6 w-6" />} />}
    </div>
  );
}
