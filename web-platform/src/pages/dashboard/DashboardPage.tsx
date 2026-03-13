import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Megaphone,
  FileText,
  CheckCircle,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  subscribeToUserGroups,
  subscribeToPosts,
  subscribeToUnits,
  type GroupPost,
  type AcademicUnit,
} from "../../lib/groups";
import { subscribeToNotes, type Note } from "../../lib/notes";
import { subscribeToTasks, type Task } from "../../lib/tasks";
import { subscribeToCourses } from "../../lib/courses";

const DAY_MAP: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};
const TODAY_INDEX = new Date().getDay(); // 0-6
const TODAY_NAME = DAY_MAP[TODAY_INDEX];

type TodayClass = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  location: string;
  type: "unit" | "personal";
  code?: string;
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Data State
  const [announcements, setAnnouncements] = useState<GroupPost[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Schedule State
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);

  // 1. Fetch Schedule (Personal + Group Units)
  useEffect(() => {
    if (!user) return;

    // Listen for Personal Courses
    const unsubCourses = subscribeToCourses(user.uid, (personalCourses) => {
      // Filter for today
      const todaysPersonal = personalCourses
        .filter((c) => c.dayOfWeek === TODAY_INDEX)
        .map((c) => ({
          id: c.id,
          name: c.name,
          startTime: c.startTime,
          endTime: c.endTime,
          location: c.location,
          type: "personal" as const,
          code: c.code,
        }));

      // Listen for Group Units
      // This is a bit complex as we need to subscribe to groups first, then units.
      // For dashboard "At a Glance", we might just fetch once or do a simpler subscription pattern
      // reusing the logic from TimetablePage would be best, but for now let's reproduce it to avoid prop drilling complex state.

      const unsubGroups = subscribeToUserGroups(user.uid, (groups) => {
        if (groups.length === 0) {
          setTodayClasses(
            todaysPersonal.sort((a, b) =>
              a.startTime.localeCompare(b.startTime),
            ),
          );
          return;
        }

        const unitsMap = new Map<string, AcademicUnit[]>();
        const groupUnsubs: (() => void)[] = [];

        groups.forEach((g) => {
          const u = subscribeToUnits(g.id, (units) => {
            unitsMap.set(g.id, units);

            // Recalculate everything whenever any unit updates
            const allUnits = Array.from(unitsMap.values()).flat();

            const todaysUnits: TodayClass[] = [];
            allUnits.forEach((unit) => {
              unit.schedule.forEach((slot) => {
                if (slot.day === TODAY_NAME) {
                  todaysUnits.push({
                    id: unit.id + slot.startTime,
                    name: unit.name,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    location: slot.location,
                    type: "unit",
                    code: unit.code,
                  });
                }
              });
            });

            const all = [...todaysPersonal, ...todaysUnits].sort((a, b) =>
              a.startTime.localeCompare(b.startTime),
            );
            setTodayClasses(all);
          });
          groupUnsubs.push(u);
        });

        // Cleanup sub-listeners when groups change
        // Note: This cleanup logic in useEffect is tricky without a ref, keeping it simple for now.
      });

      return () => unsubGroups();
    });

    return () => unsubCourses();
  }, [user]);

  // Fetch Announcements from all groups
  // ... (Existing Announcement Logic)
  useEffect(() => {
    if (!user) return;
    let postUnsubscribes: (() => void)[] = [];
    const groupUnsubscribe = subscribeToUserGroups(user.uid, (groups) => {
      postUnsubscribes.forEach((unsub) => unsub());
      postUnsubscribes = [];
      const postsMap: Record<string, GroupPost[]> = {};
      if (groups.length === 0) {
        setAnnouncements([]);
        return;
      }
      groups.forEach((group) => {
        const unsub = subscribeToPosts(group.id, (posts) => {
          // Flatten posts with Group Name attached for context
          const enhancedPosts = posts
            .filter((p) => p.type === "announcement")
            .map((p) => ({ ...p, groupName: group.name })); // We'll need to update the Type or just cast

          postsMap[group.id] = enhancedPosts;
          const allAnnouncements = Object.values(postsMap)
            .flat()
            .sort(
              (a, b) =>
                (b.createdAt?.toMillis?.() || 0) -
                (a.createdAt?.toMillis?.() || 0),
            );
          setAnnouncements(allAnnouncements);
        });
        postUnsubscribes.push(unsub);
      });
    });
    return () => {
      groupUnsubscribe();
      postUnsubscribes.forEach((unsub) => unsub());
    };
  }, [user]);

  // Fetch Recent Notes (Existing)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotes(user.uid, (notes) => {
      const sorted = [...notes]
        .sort((a, b) => b.lastModified - a.lastModified)
        .slice(0, 5);
      setRecentNotes(sorted);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Tasks (Existing)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTasks(user.uid, (allTasks) => {
      const pending = allTasks
        .filter((t) => !t.completed)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .slice(0, 5);
      setTasks(pending);
    });
    return () => unsubscribe();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {getGreeting()}, {user?.displayName?.split(" ")[0] || "Student"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Here's what's happening today.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Schedule Widget */}
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Today's Schedule
              <span className="text-muted-foreground font-normal">
                ({TODAY_NAME})
              </span>
            </h3>
            <button
              onClick={() => navigate("/timetable")}
              className="text-xs text-primary hover:underline"
            >
              View Calendar
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[280px]">
            {todayClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-md py-10">
                <CalendarIcon className="h-6 w-6 mb-2 opacity-30" />
                <span className="text-sm">No classes today</span>
              </div>
            ) : (
              todayClasses.map((cls, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 p-3 rounded-md border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center text-center w-12 shrink-0">
                    <span className="text-xs font-medium text-foreground">
                      {cls.startTime}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-none my-0.5">
                      to
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {cls.endTime}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 border-l border-border pl-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {cls.name}
                      </h4>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          cls.type === "unit"
                            ? "bg-primary/10 text-primary"
                            : "bg-green-500/10 text-green-600 dark:text-green-400"
                        }`}
                      >
                        {cls.type === "unit" ? "CLASS" : "PERSONAL"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {cls.location || "TBA"}
                      </span>
                      {cls.code && (
                        <span className="flex items-center">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {cls.code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks Widget */}
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Tasks Due Soon
            </h3>
            <button
              onClick={() => navigate("/tasks")}
              className="text-xs text-primary hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[280px]">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-md py-10">
                <CheckCircle className="h-6 w-6 mb-2 opacity-30" />
                <span className="text-sm">No pending tasks</span>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate("/tasks")}
                  className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      task.priority === "high"
                        ? "bg-red-500"
                        : task.priority === "medium"
                          ? "bg-amber-500"
                          : "bg-green-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(task.dueDate, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
              <FileText className="h-4 w-4 text-orange-500" />
              Recent Notes
            </h3>
            <button
              onClick={() => navigate("/notebook")}
              className="text-xs text-primary hover:underline"
            >
              All Notes
            </button>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[280px]">
            {recentNotes.length === 0 ? (
              <div className="flex items-center justify-center text-muted-foreground text-sm py-10 border border-dashed border-border rounded-md">
                No notes yet
              </div>
            ) : (
              recentNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => navigate("/notebook")}
                  className="p-3 rounded-md border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {note.title || "Untitled Note"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {note.content.replace(/<[^>]*>?/gm, "") || "No content"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements Feed */}
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
              <Megaphone className="h-4 w-4 text-red-500" />
              Announcements
            </h3>
            <span className="text-xs text-muted-foreground">All classes</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px]">
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground text-sm py-10 border border-dashed border-border rounded-md">
                <Megaphone className="h-6 w-6 mb-2 opacity-30" />
                <p>No announcements</p>
              </div>
            ) : (
              announcements.map((post) => (
                <div
                  key={post.id}
                  className="p-3 rounded-md border border-border border-l-2 border-l-red-500"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {(post as any).groupName}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                      {post.createdAt?.toMillis
                        ? formatDistanceToNow(post.createdAt.toMillis(), {
                            addSuffix: true,
                          })
                        : "Just now"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {post.content}
                  </p>
                  {post.unitName && (
                    <span className="mt-2 inline-flex items-center text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {post.unitName}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
