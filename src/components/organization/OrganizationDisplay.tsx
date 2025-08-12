import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Mail, Phone, MapPin, Globe, DollarSign } from 'lucide-react';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';

interface OrganizationDisplayProps {
  showHeader?: boolean;
  className?: string;
  compact?: boolean;
}

export const OrganizationDisplay: React.FC<OrganizationDisplayProps> = ({ 
  showHeader = true, 
  className = '',
  compact = false 
}) => {
  const { organizationInfo, getCountryFlag, getCurrencySymbol } = useOrganizationSettings();

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Building className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{organizationInfo.name}</span>
        {organizationInfo.country && (
          <span className="text-sm">{getCountryFlag()}</span>
        )}
        {organizationInfo.currency && (
          <Badge variant="outline" className="text-xs">
            {getCurrencySymbol()}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Organization Information
          </CardTitle>
          <CardDescription>
            Current organization details and settings
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{organizationInfo.name || 'No organization name'}</p>
                <p className="text-xs text-muted-foreground">Organization Name</p>
              </div>
            </div>

            {organizationInfo.email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{organizationInfo.email}</p>
                  <p className="text-xs text-muted-foreground">Email</p>
                </div>
              </div>
            )}

            {organizationInfo.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{organizationInfo.formattedPhone}</p>
                  <p className="text-xs text-muted-foreground">Phone</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {organizationInfo.country && (
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {getCountryFlag()} {organizationInfo.country}
                  </p>
                  <p className="text-xs text-muted-foreground">Country</p>
                </div>
              </div>
            )}

            {organizationInfo.currency && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {organizationInfo.currency} ({getCurrencySymbol()})
                  </p>
                  <p className="text-xs text-muted-foreground">Currency</p>
                </div>
              </div>
            )}

            {organizationInfo.address && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{organizationInfo.address}</p>
                  <p className="text-xs text-muted-foreground">Address</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};