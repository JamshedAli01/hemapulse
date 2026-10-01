
import { EmptyState } from '../components/ui/EmptyState';
import { Users } from 'lucide-react';

export default function Donors() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Donors</h1>
        <p className="text-muted-foreground">Manage donor profiles, availability, and eligibility.</p>
      </div>
      <EmptyState 
        title="Donors Pending"
        description="The donor management interface will be implemented in a future part."
        icon={<Users className="h-6 w-6" />}
      />
    </div>
  );
}
