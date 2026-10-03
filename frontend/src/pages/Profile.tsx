import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { User, Mail, Phone, Shield } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
