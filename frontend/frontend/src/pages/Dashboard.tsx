import { useNavigate } from 'react-router-dom';
import {
  Droplet,
  Users,
  Building2,
  Bell,
  LayoutDashboard,
  Activity,
  CheckCircle2,
  RefreshCcw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { UserRole } from '../types/auth';
import { StatCard } from '../components/shared/StatCard';
import { QuickActionCard } from '../components/shared/QuickActionCard';
import { Spinner } from '../components/ui/Spinner';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';

// Role-aware context message
function roleDescription(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'You have full administrative access. Monitor the network and manage all resources.';
    case UserRole.DONOR:
      return 'Thank you for being a donor. Review open requests and respond where you can help.';
    case UserRole.REQUESTER:
      return 'Manage your blood requests and track their fulfillment status.';
    case UserRole.HOSPITAL:
      return 'Oversee blood requests originating from your hospital.';
    default:
      return 'Welcome to HemaPulse.';
  }
}

// Role-aware badge color
function roleBadgeClass(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'bg-purple-100 text-purple-800';
    case UserRole.DONOR:
      return 'bg-green-100 text-green-800';
    case UserRole.REQUESTER:
      return 'bg-blue-100 text-blue-800';
    case UserRole.HOSPITAL:
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useDashboard();

  // While auth resolves, show spinner
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  // Fallback guard (ProtectedRoute should handle this)
  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const { summary, bloodGroups } = data;

  const hasSummaryData =
    summary &&
    (summary.total_donors != null ||
      summary.total_requests != null ||
      summary.active_requests != null ||
      summary.fulfilled_requests != null ||
      summary.total_hospitals != null);

  // Quick actions — only real routes
  const quickActions = [
    {
      title: 'Blood Requests',
      description: 'Browse and manage active blood requests',
      href: '/requests',
      icon: Droplet,
      variant: 'primary' as const,
    },
    {
      title: 'Donors',
      description: 'Find donors by blood group and location',
      href: '/donors',
      icon: Users,
    },
    {
      title: 'Hospitals',
      description: 'View participating hospitals',
      href: '/hospitals',
      icon: Building2,
    },
    {
      title: 'Notifications',
      description: 'Check alerts and messages',
      href: '/notifications',
      icon: Bell,
    },
  ];

  return (
    <div className="space-y-8">

      {/* ── Welcome header ────────────────────────────────── */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-muted-foreground">{roleDescription(user.role)}</p>
        </div>
        <span
          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${roleBadgeClass(user.role)}`}
        >
          {user.role}
        </span>
      </section>

      {/* ── Account info strip ────────────────────────────── */}
      <section className="rounded-lg border bg-surface p-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6 text-sm">
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">Email: </span>
          {user.email}
        </span>
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">Phone: </span>
          {user.phone}
        </span>
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">Account ID: </span>
          #{user.id}
        </span>
      </section>

      {/* ── Summary stats ─────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Network Overview</h2>

        {isLoading && (
          <div className="flex items-center gap-3 py-4 text-muted-foreground">
            <Spinner size="md" />
            <span className="text-sm">Loading statistics…</span>
          </div>
        )}

        {!isLoading && error && (
          <Alert variant="warning">
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span>Could not load dashboard statistics. The backend may not be running.</span>
              <button
                onClick={refetch}
                className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:no-underline"
              >
                <RefreshCcw className="h-3 w-3" />
                Retry
              </button>
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && hasSummaryData && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              title="Total Donors"
              value={summary!.total_donors}
              description="Registered donors"
              icon={Users}
              variant="primary"
            />
            <StatCard
              title="Total Requests"
              value={summary!.total_requests}
              description="All blood requests"
              icon={Droplet}
              variant="primary"
            />
            <StatCard
              title="Active Requests"
              value={summary!.active_requests}
              description="Awaiting fulfillment"
              icon={Activity}
              variant="warning"
            />
            <StatCard
              title="Fulfilled"
              value={summary!.fulfilled_requests}
              description="Successfully matched"
              icon={CheckCircle2}
              variant="success"
            />
            <StatCard
              title="Hospitals"
              value={summary!.total_hospitals}
              description="Participating hospitals"
              icon={Building2}
              variant="primary"
            />
          </div>
        )}

        {!isLoading && !error && !hasSummaryData && (
          <EmptyState
            title="No network statistics yet"
            description="Statistics will appear here once the backend is connected and data is available."
            icon={<LayoutDashboard className="h-6 w-6" />}
          />
        )}
      </section>

      {/* ── Blood group breakdown ──────────────────────────── */}
      {!isLoading && bloodGroups.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Donors by Blood Group</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {bloodGroups.map((bg) => (
              <div
                key={bg.blood_group}
                className="flex flex-col items-center rounded-lg border bg-surface p-3 text-center"
              >
                <span className="text-lg font-bold text-primary">{bg.blood_group}</span>
                <span className="text-xs text-muted-foreground mt-1">{bg.count} donor{bg.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Quick actions ──────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              href={action.href}
              icon={action.icon}
              variant={action.variant}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
