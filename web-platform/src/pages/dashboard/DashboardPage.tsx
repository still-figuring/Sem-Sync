import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Megaphone,
  FileText,
  CheckCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // Add this
import { useAuthStore } from "../../store/authStore";
import {
  subscribeToUserGroups,
  subscribeToPosts,
  type GroupPost,
} from "../../lib/groups";
import { subscribeToNotes, type Note } from "../../lib/notes";
import { subscribeToTasks, type Task } from "../../lib/tasks";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate(); // Add hook
  const [announcements, setAnnouncements] = useState<GroupPost[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Fetch Announcements from all groups
  useEffect(() => {
    if (!user) return;

    let postUnsubscribes: (() => void)[] = [];

    // 1. Get User's Groups
    const groupUnsubscribe = subscribeToUserGroups(user.uid, (groups) => {
      // Clean up previous listeners if groups change
      postUnsubscribes.forEach((unsub) => unsub());
      postUnsubscribes = [];

      const postsMap: Record<string, GroupPost[]> = {};

      if (groups.length === 0) {
        setAnnouncements([]);
        return;
      }

      // 2. Listen to posts for each group
      groups.forEach((group) => {
        const unsub = subscribeToPosts(group.id, (posts) => {
          // Filter for announcements only
          postsMap[group.id] = posts.filter((p) => p.type === "announcement");

          // Combine all and sort by date descending
          const allAnnouncements = Object.values(postsMap)
            .flat()
            .sort((a, b) => {
              const timeA = a.createdAt?.toMillis?.() || 0;
              const timeB = b.createdAt?.toMillis?.() || 0;
              return timeB - timeA;
            });

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

  // Fetch Recent Notes
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotes(user.uid, (notes) => {
      // Sort by lastModified desc and take top 5
      const sorted = [...notes]
        .sort((a, b) => b.lastModified - a.lastModified)
        .slice(0, 5);
      setRecentNotes(sorted);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Tasks
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTasks(user.uid, (allTasks) => {
      // Filter for incomplete tasks, sort by due date (nearest first)
      const pending = allTasks
        .filter((t) => !t.completed)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .slice(0, 5);
      setTasks(pending);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Tasks
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTasks(user.uid, (allTasks) => {
      // Filter for incomplete tasks, sort by due date (nearest first)
      const pending = allTasks
        .filter((t) => !t.completed)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .slice(0, 5);
      setTasks(pending);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.displayName?.split(" ")[0] || "Student"}! Here's
          what's happening today.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Calendar Widget */}
        <div className="col-span-4 rounded-xl border bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-600" />
              Today's Schedule
            </h3>
            <button
              onClick={() => navigate("/timetable")}
              className="text-xs text-indigo-600 hover:underline"
            >
              View Calendar
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center text-gray-400 border-2 border-dashed rounded-lg bg-gray-50">
            <span className="text-sm">No classes scheduled today</span>
          </div>
        </div>

        {/* Tasks Widget */}
        <div className="col-span-3 rounded-xl border bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Tasks
            </h3>
            <button
              onClick={() => navigate("/tasks")}
              className="text-xs text-indigo-600 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
            {tasks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <span className="text-sm">No pending tasks</span>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate("/tasks")}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 bg-white border border-gray-100 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      task.priority === "high"
                        ? "bg-red-500"
                        : task.priority === "medium"
                        ? "bg-orange-400"
                        : "bg-green-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {task.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {task.courseCode ? (
                        <span className="font-semibold">
                          {task.courseCode} •{" "}
                        </span>
                      ) : (
                        ""
                      )}
                      Due {task.dueDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div className="col-span-3 rounded-xl border bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Recent Notes
            </h3>
            <button
              onClick={() => navigate("/notebook")}
              className="text-xs text-indigo-600 hover:underline"
            >
              All Notes
            </button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px]">
            {recentNotes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No notes created yet
              </div>
            ) : (
              recentNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => navigate("/notebook")}
                  className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors group"
                >
                  <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {note.title || "Untitled Note"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {note.content.replace(/<[^>]*>?/gm, "") || "No content"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements Feed */}
        <div className="col-span-4 rounded-xl border bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-red-600" />
              Class Announcements
            </h3>
            <span className="text-xs text-gray-500">From all your classes</span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2">
            {announcements.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm py-8">
                <Megaphone className="h-8 w-8 mb-2 opacity-20" />
                <p>No active announcements</p>
              </div>
            ) : (
              announcements.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-lg border-l-4 border-l-red-500 bg-red-50/50 border-gray-100 border-y border-r"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-900 text-sm">
                      {post.authorName}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {post.createdAt?.toMillis
                        ? formatDistanceToNow(post.createdAt.toMillis(), {
                            addSuffix: true,
                          })
                        : "Just now"}
                    </span>
                  </div>
                  {/* Ideally we'd show the Group Name here too, but we need to map groupId back to name */}
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {post.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
