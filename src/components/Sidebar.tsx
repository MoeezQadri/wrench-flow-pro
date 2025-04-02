
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
  Building,
  CalendarCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUser, hasPermission } from '@/services/data-service';

// Define nav items with permission requirements
const navItems = [
  { 
    name: 'Dashboard', 
    path: '/', 
    icon: <LayoutDashboard className="w-5 h-5" />,
    permission: { resource: 'dashboard', action: 'view' }
  },
  { 
    name: 'Invoices', 
    path: '/invoices', 
    icon: <FileText className="w-5 h-5" />,
    permission: { resource: 'invoices', action: 'view' }
  },
  { 
    name: 'Customers', 
    path: '/customers', 
    icon: <Users className="w-5 h-5" />,
    permission: { resource: 'customers', action: 'view' }
  },
  { 
    name: 'Mechanics', 
    path: '/mechanics', 
    icon: <Wrench className="w-5 h-5" />,
    permission: { resource: 'mechanics', action: 'view' }
  },
  { 
    name: 'Tasks', 
    path: '/tasks', 
    icon: <CalendarCheck className="w-5 h-5" />,
    permission: { resource: 'tasks', action: 'view' }
  },
  { 
    name: 'Parts', 
    path: '/parts', 
    icon: <ShoppingBag className="w-5 h-5" />,
    permission: { resource: 'parts', action: 'view' }
  },
  { 
    name: 'Expenses', 
    path: '/expenses', 
    icon: <DollarSign className="w-5 h-5" />,
    permission: { resource: 'expenses', action: 'view' }
  },
  { 
    name: 'Attendance', 
    path: '/attendance', 
    icon: <ClipboardCheck className="w-5 h-5" />,
    permission: { resource: 'attendance', action: 'view' }
  },
  { 
    name: 'Users', 
    path: '/users', 
    icon: <UserCog className="w-5 h-5" />,
    permission: { resource: 'users', action: 'view' }
  },
  { 
    name: 'Settings', 
    path: '/settings', 
    icon: <Settings className="w-5 h-5" />,
    permission: { resource: 'settings', action: 'view' }
  },
];

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const currentUser = getCurrentUser();
  
  // Filter nav items based on user permissions
  const filteredNavItems = navItems.filter(item => 
    hasPermission(currentUser, item.permission.resource, item.permission.action)
  );

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
          <div className="flex items-center">
            <Building className="w-6 h-6 text-wrench-light-blue" />
            <span className="ml-2 font-bold text-xl">WrenchFlow Pro</span>
          </div>
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
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
