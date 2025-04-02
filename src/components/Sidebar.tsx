
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Wrench, 
  ShoppingBag, 
  Calendar, 
  DollarSign,
  Settings, 
  Menu, 
  X,
  ClipboardCheck,
  UserCog,
  CalendarCheck,
  Wallet,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUser, hasPermission } from '@/services/data-service';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';
import Logo from './Logo';

// Import the RolePermissionMap from data-service instead of types
import type { RolePermissionMap } from '@/services/data-service';

// Define our types for the permission system
type ResourceKey = keyof RolePermissionMap;

// Define permission interface
interface NavItemPermission {
  resource: ResourceKey;
  action: string;
}

// Define our navItems with correct typing
const navItems = [
  { 
    name: 'Dashboard', 
    path: '/', 
    icon: <LayoutDashboard className="w-5 h-5" />,
    permission: { resource: 'dashboard' as ResourceKey, action: 'view' }
  },
  { 
    name: 'Invoices', 
    path: '/invoices', 
    icon: <FileText className="w-5 h-5" />,
    permission: { resource: 'invoices' as ResourceKey, action: 'view' }
  },
  { 
    name: 'Customers', 
    path: '/customers', 
    icon: <Users className="w-5 h-5" />,
    permission: { resource: 'customers' as ResourceKey, action: 'view' }
  },
  { 
    name: 'Mechanics', 
    path: '/mechanics', 
    icon: <Wrench className="w-5 h-5" />,
    permission: { resource: 'mechanics' as ResourceKey, action: 'view' }
  },
  { 
    name: 'Tasks', 
    path: '/tasks', 
    icon: <CalendarCheck className="w-5 h-5" />,
    permission: { resource: 'tasks' as ResourceKey, action: 'view' }
  },
  { 
    name: 'Parts', 
    path: '/parts', 
    icon: <ShoppingBag className="w-5 h-5" />,
    permission: { resource: 'parts' as ResourceKey, action: 'view' }
  },
  { 
    name: 'Finance', 
    path: '/finance', 
    icon: <Wallet className="w-5 h-5" />,
    permission: { resource: 'finance' as ResourceKey, action: 'view' }
  },
  { 
    name: 'Attendance', 
    path: '/attendance', 
    icon: <ClipboardCheck className="w-5 h-5" />,
    permission: { resource: 'attendance' as ResourceKey, action: 'view' }
  },
  { 
    name: 'Users', 
    path: '/users', 
    icon: <UserCog className="w-5 h-5" />,
    permission: { resource: 'users' as ResourceKey, action: 'view' }
  },
  { 
    name: 'Reports', 
    path: '/reports', 
    icon: <FileText className="w-5 h-5" />,
    permission: { resource: 'reports' as ResourceKey, action: 'view' }
  },
  { 
    name: 'Settings', 
    path: '/settings', 
    icon: <Settings className="w-5 h-5" />,
    permission: { resource: 'settings' as ResourceKey, action: 'view' }
  },
  { 
    name: 'Help', 
    path: '/help', 
    icon: <HelpCircle className="w-5 h-5" />,
    permission: { resource: 'dashboard' as ResourceKey, action: 'view' } // Using dashboard permission so most users can see help
  },
];

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const currentUser = getCurrentUser();
  const { logout } = useAuthContext();
  
  const filteredNavItems = navItems.filter(item => {
    return hasPermission(
      currentUser, 
      item.permission.resource,
      item.permission.action
    );
  });

  const handleLogout = () => {
    logout();
    toast.success('Successfully logged out');
  };
  
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <Logo textColor="text-sidebar-foreground" />
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul>
            {filteredNavItems.map((item) => (
              <li key={item.name} className="px-2">
                <Link
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'hover:bg-sidebar-border/50 text-sidebar-foreground/80 hover:text-sidebar-foreground'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-wrench-light-blue flex items-center justify-center">
              <span className="font-bold text-white">
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="ml-3">
              <p className="font-medium">{currentUser.name}</p>
              <p className="text-sm text-sidebar-foreground/70 capitalize">{currentUser.role}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
