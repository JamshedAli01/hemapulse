import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, RefreshCcw } from 'lucide-react';
import { hospitalService } from '../services/hospitalService';
import { requestService } from '../services/requestService';
import { handleApiError } from '../services/apiClient';
import { Hospital } from '../types/hospital';
import { BloodRequest } from '../types/request';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { RequestStatusBadge } from '../components/shared/RequestStatusBadge';

export default function Hospitals() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [hospitalData, requestData] = await Promise.all([hospitalService.listHospitals(), requestService.listRequests()]);
      setHospitals(hospitalData);
      setRequests(requestData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">Hospitals</h1><p className="text-muted-foreground">Hospital information and your blood requests.</p></div><Button onClick={() => navigate('/requests/new')}><Plus className="mr-2 h-4 w-4" />Create blood request</Button></div>
      {error && <Alert variant="destructive"><AlertDescription className="flex items-center justify-between">{error}<button onClick={loadData} className="underline" aria-label="Retry"><RefreshCcw className="h-4 w-4" /></button></AlertDescription></Alert>}
      {isLoading && <div className="flex items-center gap-3 py-8 text-muted-foreground"><Spinner /><span>Loading hospitals and requests…</span></div>}
      {!isLoading && !error && <>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Hospital directory</CardTitle></CardHeader><CardContent>{hospitals.length === 0 ? <EmptyState title="No hospitals found" description="There are no hospitals available yet." icon={<Building2 className="h-6 w-6" />} /> : <div className="grid gap-4 md:grid-cols-2">{hospitals.map((hospital) => <div key={hospital.id} className="rounded-md border p-4"><div className="flex justify-between gap-3"><h3 className="font-semibold">{hospital.name}</h3><span className="text-xs text-muted-foreground">ID #{hospital.id}</span></div><p className="mt-1 text-sm text-muted-foreground">{hospital.address}, {hospital.city}</p>{hospital.contact_phone && <p className="mt-2 text-sm">{hospital.contact_phone}</p>}</div>)}</div>}</CardContent></Card>
        <Card><CardHeader><CardTitle>My blood requests</CardTitle></CardHeader><CardContent>{requests.length === 0 ? <EmptyState title="No requests yet" description="Create a blood request when your hospital needs donors." icon={<Plus className="h-6 w-6" />} /> : <div className="space-y-3">{requests.map((request) => <button key={request.id} onClick={() => navigate(`/requests/${request.id}`)} className="w-full rounded-md border p-4 text-left hover:bg-muted/50"><div className="flex items-center justify-between gap-3"><span className="font-medium">{request.blood_group} · {request.units_required} unit{request.units_required === 1 ? '' : 's'}</span><RequestStatusBadge value={request.status} /></div><p className="mt-1 text-sm text-muted-foreground">{request.description}</p></button>)}</div>}</CardContent></Card>
      </>}
    </div>
  );
}
