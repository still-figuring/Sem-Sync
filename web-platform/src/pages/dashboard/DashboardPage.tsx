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
              a.startTime.localeCompare(b.startTime)
            )
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
              a.startTime.localeCompare(b.startTime)
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
                (a.createdAt?.toMillis?.() || 0)
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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          {getGreeting()}, {user?.displayName?.split(" ")[0] || "Student"}!
          Here's what's happening today.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Today's Schedule Widget */}
        <div className="col-span-4 rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Today's Schedule{" "}
              <span className="text-muted-foreground font-normal text-sm">
                ({TODAY_NAME})
              </span>
            </h3>
            <button
              onClick={() => navigate("/timetable")}
              className="text-xs text-primary hover:text-primary/80 hover:underline"
            >
              View Full Calendar
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[250px]">
            {todayClasses.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/30 h-32">
                <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
                <span className="text-sm">No classes scheduled today</span>
              </div>
            ) : (
              todayClasses.map((cls, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-card rounded border border-border shadow-sm shrink-0">
                    <span className="text-xs font-bold text-foreground">
                      {cls.startTime}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      to
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {cls.endTime}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-foreground text-sm truncate">
                        {cls.name}
                      </h4>
                      {cls.type === "unit" ? (
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          UNIT
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded">
                          PERSONAL
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {cls.location || "TBA"}
                      </div>
                      {cls.code && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {cls.code}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks Widget */}
        <div className="col-span-3 rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Tasks Due Soon
            </h3>
            <button
              onClick={() => navigate("/tasks")}
              className="text-xs text-primary hover:text-primary/80 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
            {tasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/30 h-32">
                <CheckCircle className="h-8 w-8 mb-2 opacity-20" />
                <span className="text-sm">No active tasks</span>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate("/tasks")}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 bg-card border border-border transition-colors cursor-pointer"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      task.priority === "high"
                        ? "bg-red-500"
                        : task.priority === "medium"
                        ? "bg-orange-500"
                        : "bg-green-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">
                      {task.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                      <span className="flex items-center text-orange-600 dark:text-orange-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(task.dueDate, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div className="col-span-3 rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-orange-500" />
              Recent Notes
            </h3>
            <button
              onClick={() => navigate("/notebook")}
              className="text-xs text-primary hover:text-primary/80 hover:underline"
            >
              All Notes
            </button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px]">
            {recentNotes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No notes created yet
              </div>
            ) : (
              recentNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => navigate("/notebook")}
                  className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group"
                >
                  <div className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {note.title || "Untitled Note"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {note.content.replace(/<[^>]*>?/gm, "") || "No content"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements Feed */}
        <div className="col-span-4 rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <Megaphone className="h-5 w-5 text-red-500" />
              Class Announcements
            </h3>
            <span className="text-xs text-muted-foreground">
              From all your classes
            </span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2">
            {announcements.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm py-8">
                <Megaphone className="h-8 w-8 mb-2 opacity-20" />
                <p>No active announcements</p>
              </div>
            ) : (
              announcements.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-lg border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10 border-border border-y border-r"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-foreground text-sm">
                      {(post as any).groupName} • {post.authorName}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {post.createdAt?.toMillis
                        ? formatDistanceToNow(post.createdAt.toMillis(), {
                            addSuffix: true,
                          })
                        : "Just now"}
                    </span>
                  </div>
                  <p className="text-foreground/90 text-sm leading-relaxed">
                    {post.content}
                  </p>
                  {post.unitName && (
                    <div className="mt-2 inline-flex items-center px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {post.unitName}
                    </div>
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
