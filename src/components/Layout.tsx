
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Menu, Settings } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import Logo from './Logo';

const Layout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { currentUser } = useAuthContext();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between border-b px-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden md:block">
              <Logo />
            </div>
            {currentUser?.organizationId && (
              <span className="ml-2 text-muted-foreground hidden md:block">
                | {currentUser.role === 'owner' && 'Admin'} Dashboard
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
