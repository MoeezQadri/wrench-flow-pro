import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Settings,
  Trash2,
  Eye
} from 'lucide-react';
import { Organization } from '@/components/admin/types';

interface OrganizationCardProps {
  organization: Organization;
  userCount: number;
  onView: (id: string) => void;
  onEdit: (organization: Organization) => void;
  onDelete: (id: string) => void;
}

export const OrganizationCard = ({ 
  organization, 
  userCount, 
  onView, 
  onEdit, 
  onDelete 
}: OrganizationCardProps) => {
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

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-500 text-white';
      case 'professional':
        return 'bg-blue-500 text-white';
      case 'basic':
        return 'bg-green-500 text-white';
      case 'trial':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {organization.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getLevelColor(organization.subscription_level)}>
                {organization.subscription_level}
              </Badge>
              <Badge variant="outline" className={getStatusColor(organization.subscription_status)}>
                {organization.subscription_status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(organization.id)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(organization)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(organization.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{userCount} users</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Created {new Date(organization.created_at).toLocaleDateString()}
            </span>
          </div>
          
          {organization.trial_ends_at && (
            <div className="flex items-center gap-2 col-span-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Trial ends {new Date(organization.trial_ends_at).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {organization.email && (
            <div className="col-span-2 text-xs text-muted-foreground">
              {organization.email}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};