import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  BookText,
  Users,
  GraduationCap,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import { auth } from "../../lib/firebase";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const { user } = useAuthStore();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Timetable", href: "/timetable", icon: CalendarDays },
    { name: "Classes", href: "/groups", icon: Users },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Notebook", href: "/notebook", icon: BookText },
  ];

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-card transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <div className="flex items-center gap-2 font-bold text-xl">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span>
              Sem<span className="text-primary">Sync</span>
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 lg:hidden"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="flex flex-col gap-1 p-4">
          <div className="px-2 py-2 text-xs font-semibold uppercase text-muted-foreground/50">
            Menu
          </div>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="absolute bottom-4 left-0 right-0 p-4">
          <div className="flex items-center gap-3 rounded-lg border bg-background p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              {user?.displayName?.charAt(0) || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">
                {user?.displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
