import { Menu, Sun, Moon, Plus } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useLocation } from "react-router-dom";
import NotificationsDropdown from "../notifications/NotificationsDropdown";
import { useState } from "react";
import AddTaskDialog from "../tasks/AddTaskDialog";
import { useAuthStore } from "../../store/authStore";
import { addTask } from "../../lib/tasks";

interface TopNavProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/timetable": "Timetable",
  "/tasks": "Tasks",
  "/notebook": "Notes",
  "/groups": "Classes",
  "/profile": "Settings",
  "/instructor": "Instructor Dashboard",
};

export default function TopNav({ onMenuClick }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { user } = useAuthStore();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const handleCreateTask = async (taskData: any) => {
    if (!user) return;
    await addTask(user.uid, taskData);
    setIsTaskDialogOpen(false);
  };

  const pathBase = "/" + location.pathname.split("/")[1];
  const pageTitle =
    pageTitles[pathBase] || pageTitles[location.pathname] || "SemSync";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle Menu</span>
          </button>
          <h1 className="text-lg font-semibold tracking-tight">{pageTitle}</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={
              theme === "light" ? "Switch to dark mode" : "Switch to light mode"
            }
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </button>

          <NotificationsDropdown />

          <button
            onClick={() => setIsTaskDialogOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      <AddTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onAddTask={handleCreateTask}
      />
    </header>
  );
}
