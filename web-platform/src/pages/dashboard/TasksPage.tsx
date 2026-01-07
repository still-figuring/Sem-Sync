import { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Flag,
  CheckCircle2,
  Circle,
  Trash2,
  BookOpen,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  subscribeToTasks,
  addTask,
  updateTaskStatus,
  deleteTask,
  type Task,
} from "../../lib/tasks";
import AddTaskDialog from "../../components/tasks/AddTaskDialog";

export default function TasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "todo" | "completed">("all");

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTasks(user.uid, (data) => {
      setTasks(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddTask = async (taskData: any) => {
    if (!user) return;
    await addTask(user.uid, taskData);
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    await updateTaskStatus(task.id, newStatus);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "completed") return task.status === "done";
    if (filter === "todo") return task.status !== "done";
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            My Tasks
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your assignments and to-do list.
          </p>
        </div>
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 w-fit">
        {(["all", "todo", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
              ${
                filter === f
                  ? "bg-white text-gray-950 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }
            `}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <CheckCircle2 className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No tasks found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new task.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`
                group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-4 transition-all hover:shadow-md
                ${
                  task.status === "done"
                    ? "bg-gray-50 border-gray-100 opacity-75"
                    : "bg-white border-gray-200"
                }
              `}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => handleToggleStatus(task)}
                  className={`mt-1 flex-shrink-0 rounded-full transition-colors ${
                    task.status === "done"
                      ? "text-green-500"
                      : "text-gray-300 hover:text-gray-500"
                  }`}
                >
                  {task.status === "done" ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </button>

                <div className="space-y-1">
                  <h3
                    className={`font-semibold ${
                      task.status === "done"
                        ? "line-through text-gray-500"
                        : "text-gray-900"
                    }`}
                  >
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-gray-500">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      <Flag className="mr-1 h-3 w-3" />
                      {task.priority}
                    </span>

                    <span className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {task.dueDate.toLocaleDateString()} at{" "}
                      {task.dueDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {task.courseCode && (
                      <span className="flex items-center text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        <BookOpen className="mr-1 h-3 w-3" />
                        {task.courseCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <AddTaskDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddTask={handleAddTask}
      />
    </div>
  );
}
