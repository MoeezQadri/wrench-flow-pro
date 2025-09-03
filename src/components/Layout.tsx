
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';
import { OrganizationSelector } from '@/components/layout/OrganizationSelector';
import { GlobalRecoveryButton } from '@/components/GlobalRecoveryButton';
import Logo from './Logo';
import { AppSidebar } from './AppSidebar';
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';

const Layout = () => {
  const { currentUser } = useAuthContext();
  // Temporarily disabled organization context to fix module import error
  const selectedOrganizationId = '';
  const organizations: any[] = [];
  const isSuperAdmin = currentUser?.role === 'superuser' || currentUser?.role === 'superadmin';
  const handleOrganizationChange = (orgId: string) => {};
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <SidebarInset>
          <header className="h-16 flex items-center justify-between border-b px-6">
            <div className="flex items-center">
              <SidebarTrigger />
              <div className="ml-4">
                <Logo />
              </div>
              {currentUser?.organization_id && (
                <span className="ml-2 text-muted-foreground hidden md:block">
                  | {currentUser.role === 'owner' && 'Admin'} Dashboard
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {isSuperAdmin && (
                <OrganizationSelector
                  organizations={organizations}
                  selectedOrgId={selectedOrganizationId}
                  onOrganizationChange={handleOrganizationChange}
                />
              )}
              
              <GlobalRecoveryButton />
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
