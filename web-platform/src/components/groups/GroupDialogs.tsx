import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  createGroup,
  joinGroup,
  createUnit,
  type UnitSchedule,
} from "../../lib/groups";
import { useAuthStore } from "../../store/authStore";
import { Plus, Trash2 } from "lucide-react";

interface AddUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

export function AddUnitDialog({
  open,
  onOpenChange,
  groupId,
}: AddUnitDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    lecturerName: "",
  });
  const [schedule, setSchedule] = useState<UnitSchedule[]>([
    { day: "Monday", startTime: "08:00", endTime: "10:00", location: "" },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createUnit(groupId, { ...formData, schedule });
      onOpenChange(false);
      setFormData({ name: "", code: "", lecturerName: "" });
      setSchedule([
        { day: "Monday", startTime: "08:00", endTime: "10:00", location: "" },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = (
    index: number,
    field: keyof UnitSchedule,
    value: string
  ) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-lg sm:rounded-lg max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold text-foreground">
            Add New Unit
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mb-4">
            Add a subject/module to this course.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Unit Name
                </label>
                <input
                  required
                  placeholder="e.g. Dist. Systems"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Unit Code
                </label>
                <input
                  required
                  placeholder="e.g. SCT 211"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Lecturer Name
              </label>
              <input
                required
                placeholder="e.g. Dr. Lawrence"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.lecturerName}
                onChange={(e) =>
                  setFormData({ ...formData, lecturerName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">
                  Class Schedule
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setSchedule([
                      ...schedule,
                      {
                        day: "Monday",
                        startTime: "08:00",
                        endTime: "10:00",
                        location: "",
                      },
                    ])
                  }
                  className="text-xs flex items-center text-primary hover:underline"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Slot
                </button>
              </div>
              {schedule.map((slot, index) => (
                <div
                  key={index}
                  className="grid grid-cols-7 gap-2 items-end border border-border p-2 rounded bg-muted/50"
                >
                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground">
                      Day
                    </label>
                    <select
                      className="w-full text-xs p-1 border border-input rounded bg-background text-foreground"
                      value={slot.day}
                      onChange={(e) =>
                        updateSchedule(index, "day", e.target.value)
                      }
                    >
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                      ].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground">
                      Time
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        className="w-full text-xs p-1 border border-input rounded bg-background text-foreground [&::-webkit-calendar-picker-indicator]:dark:invert"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateSchedule(index, "startTime", e.target.value)
                        }
                      />
                      <span className="text-muted-foreground/50">-</span>
                      <input
                        type="time"
                        className="w-full text-xs p-1 border border-input rounded bg-background text-foreground [&::-webkit-calendar-picker-indicator]:dark:invert"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateSchedule(index, "endTime", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground">
                      Room
                    </label>
                    <input
                      className="w-full text-xs p-1 border border-input rounded bg-background text-foreground"
                      placeholder="Lab 1"
                      value={slot.location}
                      onChange={(e) =>
                        updateSchedule(index, "location", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-1 flex justify-center pb-1">
                    {schedule.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setSchedule(schedule.filter((_, i) => i !== index))
                        }
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Unit"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
}: CreateGroupDialogProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    lecturerName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      await createGroup(user.uid, formData);
      onOpenChange(false);
      setFormData({ name: "", code: "", lecturerName: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-lg sm:rounded-lg">
          <Dialog.Title className="text-lg font-semibold text-foreground">
            Create New Class Group
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mb-4">
            Become the Class Rep and manage this group.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Course Name
              </label>
              <input
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Intro to Computer Science"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Course Code
              </label>
              <input
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. CS101"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Lecturer Name
              </label>
              <input
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Dr. Smith"
                value={formData.lecturerName}
                onChange={(e) =>
                  setFormData({ ...formData, lecturerName: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Class"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface JoinGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinGroupDialog({ open, onOpenChange }: JoinGroupDialogProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    try {
      setLoading(true);
      await joinGroup(user.uid, joinCode.trim().toUpperCase());
      onOpenChange(false);
      setJoinCode("");
    } catch (err: any) {
      setError(err.message || "Failed to join group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-lg sm:rounded-lg">
          <Dialog.Title className="text-lg font-semibold text-foreground">
            Join Existing Class
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mb-4">
            Enter the 6-character code provided by your Class Rep.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Join Code
              </label>
              <input
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary uppercase tracking-widest"
                placeholder="A1B2C3"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Joining..." : "Join Class"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
