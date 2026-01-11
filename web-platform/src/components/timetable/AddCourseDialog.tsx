import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Zod schema for validation
const courseSchema = z.object({
  name: z.string().min(2, "Course name is required"),
  location: z.string().min(1, "Location is required"),
  dayOfWeek: z.string(), // "1" for Monday
  startTime: z.string(),
  endTime: z.string(),
  color: z.string(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface AddCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCourse: (data: CourseFormData) => Promise<void>;
}

export default function AddCourseDialog({
  open,
  onOpenChange,
  onAddCourse,
}: AddCourseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      color: "#2563eb",
      dayOfWeek: "1",
    },
  });

  const onSubmit = async (data: CourseFormData) => {
    try {
      setIsLoading(true);
      await onAddCourse(data);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
              Add New Course
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              Add a recurring class to your weekly schedule.
            </Dialog.Description>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm font-medium">
                Name
              </label>
              <div className="col-span-3">
                <input
                  id="name"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g. Intro to CS"
                  {...register("name")}
                />
                {errors.name && (
                  <span className="text-xs text-destructive">
                    {errors.name.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="location"
                className="text-right text-sm font-medium"
              >
                Location
              </label>
              <div className="col-span-3">
                <input
                  id="location"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="e.g. Hall A"
                  {...register("location")}
                />
                {errors.location && (
                  <span className="text-xs text-destructive">
                    {errors.location.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="dayOfWeek"
                className="text-right text-sm font-medium"
              >
                Day
              </label>
              <select
                id="dayOfWeek"
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                {...register("dayOfWeek")}
              >
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
                <option value="0">Sunday</option>
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Time</label>
              <div className="col-span-3 flex gap-2">
                <input
                  type="time"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground [&::-webkit-calendar-picker-indicator]:dark:invert"
                  {...register("startTime")}
                />
                <span className="self-center">-</span>
                <input
                  type="time"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground [&::-webkit-calendar-picker-indicator]:dark:invert"
                  {...register("endTime")}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Color</label>
              <div className="col-span-3 flex gap-2">
                {["#2563eb", "#dc2626", "#16a34a", "#d97706", "#9333ea"].map(
                  (color) => (
                    <label key={color} className="cursor-pointer">
                      <input
                        type="radio"
                        value={color}
                        className="sr-only peer"
                        {...register("color")}
                      />
                      <div
                        className="h-6 w-6 rounded-full border border-transparent peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-ring"
                        style={{ backgroundColor: color }}
                      />
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Course
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
