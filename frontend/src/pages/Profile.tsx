
import { EmptyState } from '../components/ui/EmptyState';
import { User } from 'lucide-react';

export default function Profile() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and preferences.</p>
      </div>
      <EmptyState 
        title="Profile Pending"
        description="The profile management interface will be implemented in a future part."
        icon={<User className="h-6 w-6" />}
      />
    </div>
  );
}
