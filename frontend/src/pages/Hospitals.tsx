
import { EmptyState } from '../components/ui/EmptyState';
import { Building2 } from 'lucide-react';

export default function Hospitals() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hospitals</h1>
        <p className="text-muted-foreground">Manage hospital contacts and locations.</p>
      </div>
      <EmptyState 
        title="Hospitals Pending"
        description="The hospitals management interface will be implemented in a future part."
        icon={<Building2 className="h-6 w-6" />}
      />
    </div>
  );
}
