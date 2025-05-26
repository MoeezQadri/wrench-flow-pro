import React from "react";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Car,
  CheckSquare,
  Receipt,
  Wrench,
  Coins,
  Settings,
  User,
  Calendar,
} from "lucide-react";

import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthContext } from "@/context/AuthContext";
import { hasPermission, type RolePermissionMap } from "@/services/data-service";

interface SidebarProps {
  className?: string;
  isMobileOpen?: boolean;
  setIsMobileOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface MenuItem {
  title: string;
  href: string;
  icon: any;
  description: string;
  show: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ className, isMobileOpen, setIsMobileOpen }) => {
  const { currentUser } = useAuthContext();
  const { collapsed, setCollapsed } = useSidebar();
  const location = useLocation();

  // Type-safe permission checking
  const checkPermission = (resource: string, action: string): boolean => {
    if (!currentUser) return false;
    
    // Map old permission resource names to new ones for backward compatibility
    const resourceMap: Record<string, keyof RolePermissionMap> = {
      'dashboard': 'dashboard',
      'customers': 'customers', 
      'vehicles': 'vehicles',
      'invoices': 'invoices',
      'tasks': 'tasks',
      'mechanics': 'mechanics',
      'parts': 'parts',
      'expenses': 'expenses',
      'reports': 'reports',
      'settings': 'settings',
      'users': 'users',
      'attendance': 'attendance'
    };
    
    const mappedResource = resourceMap[resource] as keyof RolePermissionMap;
    if (!mappedResource) return false;
    
    return hasPermission(currentUser, mappedResource, action);
  };

  const menuItems: MenuGroup[] = [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          description: "Overview and key metrics",
          show: checkPermission('dashboard', 'view'),
        },
        {
          title: "Customers",
          href: "/customers",
          icon: Users,
          description: "Manage customer information",
          show: checkPermission('customers', 'view'),
        },
        {
          title: "Vehicles",
          href: "/vehicles", 
          icon: Car,
          description: "Vehicle database and history",
          show: checkPermission('vehicles', 'view'),
        },
        {
          title: "Tasks",
          href: "/tasks",
          icon: CheckSquare,
          description: "Work assignments and progress",
          show: checkPermission('tasks', 'view'),
        },
      ],
    },
    {
      title: "Financials",
      items: [
        {
          title: "Invoices",
          href: "/invoices",
          icon: Receipt,
          description: "Billing and payments",
          show: checkPermission('invoices', 'view'),
        },
        {
          title: "Expenses",
          href: "/expenses",
          icon: Coins,
          description: "Record and track expenses",
          show: checkPermission('expenses', 'view'),
        },
      ],
    },
    {
      title: "Resources",
      items: [
        {
          title: "Mechanics",
          href: "/mechanics",
          icon: Wrench,
          description: "Manage mechanic profiles",
          show: checkPermission('mechanics', 'view'),
        },
        {
          title: "Parts",
          href: "/parts",
          icon: Wrench,
          description: "Manage parts inventory",
          show: checkPermission('parts', 'view'),
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "Attendance",
          href: "/attendance",
          icon: Calendar,
          description: "Track attendance",
          show: checkPermission('attendance', 'view'),
        },
        {
          title: "Users",
          href: "/users",
          icon: User,
          description: "Manage user accounts",
          show: checkPermission('users', 'view'),
        },
        {
          title: "Settings",
          href: "/settings",
          icon: Settings,
          description: "Configure system settings",
          show: checkPermission('settings', 'view'),
        },
      ],
    },
  ];

  if (!currentUser) {
    return null;
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-secondary border-r",
      collapsed ? "w-16" : "w-[240px]",
      className
    )}>
      <div className="flex items-center py-4 px-3">
        <div className="relative min-w-[40px] h-10 mr-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.png" alt="Your profile" />
            <AvatarFallback>OM</AvatarFallback>
          </Avatar>
        </div>
        <h1 className={cn(
          "text-2xl font-bold text-primary",
          collapsed && "hidden"
        )}>
          Garage Pro
        </h1>
      </div>
      <div className="space-y-1">
        {menuItems.map((group, index) => (
          <Accordion type="single" collapsible key={index}>
            <AccordionItem value={group.title}>
              <AccordionTrigger className={cn(
                "hover:no-underline transition-all font-medium border-b px-3"
              )}>
                {group.title}
              </AccordionTrigger>
              <AccordionContent className="pl-2">
                <div className="grid gap-1">
                  {group.items.filter(item => item.show).map((item) => (
                    <Button
                      key={item.title}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start font-normal",
                        location.pathname === item.href && "bg-secondary/10"
                      )}
                      onClick={() => { }}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      <span>
                        {item.title}
                      </span>
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
      <div className="mt-auto flex items-center border-t p-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src="/avatars/01.png" alt="Your profile" />
          <AvatarFallback>OM</AvatarFallback>
        </Avatar>
        <div className="flex flex-col text-xs ml-2">
          <span className="font-medium">{currentUser.name}</span>
          <Button
            onClick={() => setCollapsed((prev) => !prev)}
            className="h-auto p-0 w-auto text-muted-foreground"
            variant="link"
            size="sm"
          >
            {collapsed ? "Expand" : "Collapse"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
