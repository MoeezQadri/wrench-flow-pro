
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import Logo from './Logo';
import { AppSidebar } from './AppSidebar';
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';

const Layout = () => {
  const { currentUser } = useAuthContext();
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
