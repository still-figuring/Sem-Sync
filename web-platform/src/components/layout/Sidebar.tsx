import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  BookText,
  Users,
  FolderOpen,
  LogOut,
  X,
  Settings,
  Megaphone,
  Smartphone,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import { auth } from "../../lib/firebase";
import { subscribeToTasks } from "../../lib/tasks";
import { useState, useEffect } from "react";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const { user } = useAuthStore();
  const [pendingTaskCount, setPendingTaskCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTasks(user.uid, (tasks) => {
      const count = tasks.filter((t) => t.status !== "done").length;
      setPendingTaskCount(count);
    });
    return () => unsubscribe();
  }, [user]);

  const mainNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Timetable", href: "/timetable", icon: CalendarDays },
    {
      name: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      badge: pendingTaskCount > 0 ? pendingTaskCount : undefined,
    },
    { name: "Notes", href: "/notebook", icon: BookText },
  ];

  const classNavigation = [
    { name: "My Classes", href: "/groups", icon: Users },
    { name: "Resources", href: "/groups", icon: FolderOpen },
  ];

  const instructorNavigation =
    user?.role === "instructor"
      ? [{ name: "Announcements", href: "/instructor", icon: Megaphone }]
      : [];

  const settingsNavigation = [
    { name: "Settings", href: "/profile", icon: Settings },
  ];

  const handleLogout = () => {
    auth.signOut();
  };

  const NavItem = ({
    item,
  }: {
    item: { name: string; href: string; icon: any; badge?: number };
  }) => (
    <NavLink
      to={item.href}
      onClick={() => setOpen(false)}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.name}
      {item.badge && (
        <span className="ml-auto rounded-full bg-primary/15 text-primary px-2 py-0.5 text-xs font-medium tabular-nums">
          {item.badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
          <span className="text-lg font-bold tracking-tight">
            Sem<span className="text-primary">Sync</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 hover:bg-muted transition-colors lg:hidden"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
          <div>
            <p className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Menu
            </p>
            <div className="space-y-0.5">
              {mainNavigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>
          </div>

          <div>
            <p className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Classes
            </p>
            <div className="space-y-0.5">
              {classNavigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>
          </div>

          {instructorNavigation.length > 0 && (
            <div>
              <p className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Instructor
              </p>
              <div className="space-y-0.5">
                {instructorNavigation.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Account
            </p>
            <div className="space-y-0.5">
              {settingsNavigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>
          </div>
        </nav>

        {/* Mobile App Banner */}
        <div className="mx-3 mb-3 p-3 rounded-xl border border-border bg-muted/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="text-sm">Get the App</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Take SemSync on the go. Currently under development for iOS &
              Android!
            </p>
            <button
              className="w-full inline-flex items-center justify-center rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary shrink-0">
              {user?.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.displayName || "User"}
              </p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {user?.role || "Student"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
