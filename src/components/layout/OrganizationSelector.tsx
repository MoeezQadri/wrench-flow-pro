import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';

interface OrganizationSelectorProps {
  organizations: Array<{
    id: string;
    name: string;
    subscription_level: string;
    subscription_status: string;
  }>;
  selectedOrgId?: string;
  onOrganizationChange: (orgId: string) => void;
}

export const OrganizationSelector = ({
  organizations,
  selectedOrgId,
  onOrganizationChange,
}: OrganizationSelectorProps) => {
  const { currentUser, organization } = useAuthContext();

  // Only show for super admins
  if (currentUser?.role !== 'superuser' && currentUser?.role !== 'superadmin') {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'suspended':
        return 'bg-destructive text-destructive-foreground';
      case 'trial':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select 
        value={selectedOrgId || 'all'} 
        onValueChange={(value) => onOrganizationChange(value === 'all' ? '' : value)}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <span>All Organizations</span>
              <Badge variant="outline">Super Admin View</Badge>
            </div>
          </SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex items-center justify-between w-full">
                <span className="truncate">{org.name}</span>
                <div className="flex items-center gap-1 ml-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(org.subscription_status)}`}
                  >
                    {org.subscription_level}
                  </Badge>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};