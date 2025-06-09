
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BarChart,
  Building2,
  Calendar,
  Car,
  CheckCircle,
  ChevronDown,
  FileText,
  Gauge,
  LayoutDashboard,
  ListChecks,
  LucideIcon,
  Settings,
  ShoppingCart,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { currentUser } = useAuthContext();
  const isAdmin = currentUser?.role === "superuser";

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

  const settingsNavItems = [
    {
      title: "Account",
      href: "/settings/account",
      icon: User,
    },
    {
      title: "Organization",
      href: "/settings/organization",
      icon: Building2,
    },
  ];

  return (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <SheetContent className="w-64 flex flex-col gap-4">
        <SheetHeader className="text-left">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navigate through the application.
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link key={item.title} to={item.href} className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary">
              <item.icon className="w-4 h-4" />
              {item.title}
            </Link>
          ))}
        </div>

        {isAdmin && (
          <>
            <Separator />

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="admin">
                <AccordionTrigger className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Admin
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2">
                  {adminNavItems.map((item) => (
                    <Link key={item.title} to={item.href} className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary">
                      <item.icon className="w-4 h-4" />
                      {item.title}
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}

        <Separator />

        <div className="flex flex-col gap-2">
          <Link to="/settings" className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
