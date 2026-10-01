import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, RefreshCcw, Droplet, Clock, MapPin } from 'lucide-react';
import { useRequests } from '../hooks/useRequests';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import { RequestListParams } from '../types/request';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Label } from '../components/ui/Label';
import { Card, CardContent } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { BloodGroupBadge } from '../components/shared/BloodGroupBadge';
import { UrgencyBadge } from '../components/shared/UrgencyBadge';
import { RequestStatusBadge } from '../components/shared/RequestStatusBadge';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const STATUSES = ['OPEN', 'CLOSED', 'CANCELLED', 'FULFILLED'];
const URGENCIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function formatDeadline(dt: string): string {
  try {
    return new Date(dt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return dt;
  }
}

export default function Requests() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<RequestListParams>({});
  const { requests, isLoading, error, refetch } = useRequests();

  const applyFilters = () => refetch(filters);

  const clearFilters = () => {
    setFilters({});
    refetch({});
  };

  const canCreate = user?.role === UserRole.REQUESTER || user?.role === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blood Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse open blood requests and help save lives.
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => navigate('/requests/new')}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-surface p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="filter-blood">Blood Group</Label>
            <Select
              id="filter-blood"
              value={filters.blood_group ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, blood_group: e.target.value || undefined }))}
            >
              <option value="">All groups</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-status">Status</Label>
            <Select
              id="filter-status"
              value={filters.status ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-urgency">Urgency</Label>
            <Select
              id="filter-urgency"
              value={filters.urgency ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, urgency: e.target.value || undefined }))}
            >
              <option value="">All urgencies</option>
              {URGENCIES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" onClick={applyFilters} className="flex-1">
              Apply
            </Button>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-3 py-8 text-muted-foreground">
          <Spinner size="md" />
          <span className="text-sm">Loading requests…</span>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span>{error}</span>
            <button
              onClick={() => refetch(filters)}
              className="inline-flex items-center gap-1 text-xs underline underline-offset-2"
            >
              <RefreshCcw className="h-3 w-3" /> Retry
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty */}
      {!isLoading && !error && requests.length === 0 && (
        <EmptyState
          title="No blood requests found"
          description="There are no blood requests matching your current filters. Try adjusting the filters or check back later."
          icon={<Droplet className="h-6 w-6" />}
          action={
            canCreate ? (
              <Button size="sm" onClick={() => navigate('/requests/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Request
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Request cards */}
      {!isLoading && !error && requests.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {requests.map((req) => (
            <Link key={req.id} to={`/requests/${req.id}`} className="group block">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardContent className="p-5 space-y-4">
                  {/* Top row: badges */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <BloodGroupBadge value={req.blood_group} />
                    {req.urgency && <UrgencyBadge value={req.urgency} />}
                    {req.status && <RequestStatusBadge value={req.status} />}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-foreground line-clamp-2">
                    {req.description || 'No description provided.'}
                  </p>

                  {/* Meta */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Droplet className="h-3.5 w-3.5 shrink-0" />
                      <span>{req.units_required} unit{req.units_required !== 1 ? 's' : ''} required</span>
                    </div>
                    {req.required_before && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>Needed by {formatDeadline(req.required_before)}</span>
                      </div>
                    )}
                    {(req.latitude != null && req.longitude != null) && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{req.latitude.toFixed(4)}, {req.longitude.toFixed(4)}</span>
                      </div>
                    )}
                    {req.hospital && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">{req.hospital.name}</span>
                        {req.hospital.city && <span>· {req.hospital.city}</span>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
