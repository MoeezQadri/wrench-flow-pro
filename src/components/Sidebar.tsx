import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  FileText, 
  CheckSquare, 
  Wrench, 
  Package, 
  Receipt, 
  BarChart3, 
  Settings, 
  UserCog,
  LogOut,
  Clock
} from "lucide-react";
import { getCurrentUser, hasPermission, rolePermissions } from "@/services/data-service";
import { RolePermissionMap } from "@/types";

interface NavItem {
  label: string;
  icon: React.ComponentType<any>;
  to: string;
  permission?: keyof RolePermissionMap;
}

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/",
    permission: 'dashboard'
  },
  {
    label: "Customers",
    icon: Users,
    to: "/customers",
    permission: 'customers'
  },
  {
    label: "Vehicles",
    icon: Car,
    to: "/vehicles",
    permission: 'vehicles'
  },
  {
    label: "Invoices",
    icon: FileText,
    to: "/invoices",
    permission: 'invoices'
  },
  {
    label: "Tasks",
    icon: CheckSquare,
    to: "/tasks",
    permission: 'tasks'
  },
  {
    label: "Mechanics",
    icon: Wrench,
    to: "/mechanics",
    permission: 'mechanics'
  },
  {
    label: "Parts",
    icon: Package,
    to: "/parts",
    permission: 'parts'
  },
  {
    label: "Expenses",
    icon: Receipt,
    to: "/expenses",
    permission: 'expenses'
  },
  {
    label: "Reports",
    icon: BarChart3,
    to: "/reports",
    permission: 'reports'
  },
  {
    label: "Settings",
    icon: Settings,
    to: "/settings",
    permission: 'settings'
  },
  {
    label: "Users",
    icon: UserCog,
    to: "/admin/users",
    permission: 'users'
  },
  {
    label: "Attendance",
    icon: Clock,
    to: "/attendance",
    permission: 'attendance'
  }
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    // Handle logout logic here
    navigate("/auth/login");
  };

  // Filter navigation items based on user permissions
  const getFilteredNavigation = () => {
    return navigationItems.filter(item => {
      if (!item.permission) return true;
      return hasPermission(currentUser, item.permission as keyof RolePermissionMap, 'view');
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 border-r py-4">
      <div className="flex items-center justify-center mb-6">
        <Link to="/" className="text-2xl font-bold">
          AutoFlow
        </Link>
      </div>
      <nav className="flex-grow px-2">
        <ul className="space-y-2">
          {getFilteredNavigation().map((item) => (
            <li key={item.label}>
              <Link
                to={item.to}
                className={cn(
                  "flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-200",
                  location.pathname === item.to ? "bg-gray-200 font-medium" : ""
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4">
        <div className="space-y-3">
          <Avatar className="w-10 h-10 mx-auto">
            <AvatarImage src="https://github.com/shadcn.png" alt="Your Avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">{currentUser?.name}</p>
            <p className="text-xs text-gray-500">{currentUser?.email}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full mt-4" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
