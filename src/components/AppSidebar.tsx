
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Car,
  FileText,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShoppingCart,
  Users,
  Wrench,
  UserRound,
  BarChart3,
  Package,
  Building,
  LogOut,
  ChevronUp,
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    resource: "dashboard",
    action: "view" as const,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: FileText,
    resource: "invoices",
    action: "view" as const,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    resource: "customers",
    action: "view" as const,
  },
  {
    title: "Vehicles",
    href: "/vehicles",
    icon: Car,
    resource: "vehicles",
    action: "view" as const,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: ListChecks,
    resource: "tasks",
    action: "view" as const,
  },
  {
    title: "Mechanics",
    href: "/mechanics",
    icon: Wrench,
    resource: "mechanics",
    action: "view" as const,
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: Calendar,
    resource: "attendance",
    action: "view" as const,
  },
  {
    title: "Parts",
    href: "/parts",
    icon: Package,
    resource: "parts",
    action: "view" as const,
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: ShoppingCart,
    resource: "expenses",
    action: "view" as const,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    resource: "reports",
    action: "view" as const,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { currentUser, logout } = useAuthContext();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Filter navigation items based on user permissions
  const getVisibleNavItems = () => {
    return navItems.filter(item => {
      // Dashboard is always visible
      if (item.resource === 'dashboard') {
        return true;
      }
      
      // Check if user has permission to view this resource
      return hasPermission(currentUser, item.resource, item.action);
    });
  };

  const visibleNavItems = getVisibleNavItems();
  const canAccessSettings = hasPermission(currentUser, 'settings', 'view');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link to={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />
        {canAccessSettings && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/settings')}>
                    <Link to="/settings">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent cursor-pointer transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground capitalize truncate">
                    {currentUser.role === 'owner' ? 'Admin' : currentUser.role}
                  </p>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2 w-full">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
