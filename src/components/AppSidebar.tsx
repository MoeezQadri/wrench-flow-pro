
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart,
  Building2,
  Calendar,
  Car,
  FileText,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShoppingCart,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: FileText,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Vehicles",
    href: "/vehicles",
    icon: Car,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: ListChecks,
  },
  {
    title: "Mechanics",
    href: "/mechanics",
    icon: Wrench,
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: Calendar,
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: ShoppingCart,
  },
];

const adminNavItems = [
  {
    title: "User Management",
    href: "/users",
    icon: User,
  },
  {
    title: "Organization",
    href: "/organization",
    icon: Building2,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart,
  },
];

export function AppSidebar() {
  const { currentUser } = useAuthContext();
  const location = useLocation();
  const isAdmin = currentUser?.role === "superuser" || currentUser?.role === "owner";

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
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

        {isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
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
          </>
        )}

        <SidebarSeparator />
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
      </SidebarContent>
    </Sidebar>
  );
}
