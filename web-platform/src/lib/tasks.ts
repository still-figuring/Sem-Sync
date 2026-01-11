import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  query,
  where,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  courseCode?: string; // Optional link to a course
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;
  completed: boolean;
}

export const subscribeToTasks = (
  userId: string,
  callback: (tasks: Task[]) => void
) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, "tasks"), where("userId", "==", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamp to JS Date
          dueDate:
            data.dueDate instanceof Timestamp
              ? data.dueDate.toDate()
              : new Date(data.dueDate),
        } as Task;
      });

      // Client-side sort by due date (nearest first)
      tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

      callback(tasks);
    },
    (error) => {
      console.error("Error subscribing to tasks:", error);
    }
  );
};

export const addTask = async (
  userId: string,
  task: Omit<Task, "id" | "userId" | "completed">
) => {
  await addDoc(collection(db, "tasks"), {
    ...task,
    userId,
    completed: task.status === "done",
    createdAt: serverTimestamp(),
  });
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
  const taskRef = doc(db, "tasks", taskId);
  await updateDoc(taskRef, {
    status,
    completed: status === "done",
  });
};

export const deleteTask = async (taskId: string) => {
  await deleteDoc(doc(db, "tasks", taskId));
};

// --- Assessment Completion Helpers (Local User State) ---

/**
 * Subscribes to the list of assessments the user has marked as "done".
 * Stored in users/{userId}/completedAssessments/{assessmentId}
 */
export const subscribeToCompletedAssessments = (
  userId: string,
  callback: (ids: string[]) => void
) => {
  const collectionRef = collection(db, "users", userId, "completedAssessments");

  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const ids = snapshot.docs.map((doc) => doc.id);
      callback(ids);
    },
    (error) => {
      console.error("Error subscribing to completed assessments:", error);
    }
  );
};

/**
 * Marks a class assessment as done (or undone) for the current user only.
 */
export const toggleAssessmentCompletion = async (
  userId: string,
  assessmentId: string,
  isComplete: boolean
) => {
  const docRef = doc(db, "users", userId, "completedAssessments", assessmentId);

  if (isComplete) {
    await setDoc(docRef, {
      completedAt: serverTimestamp(),
      assessmentId,
    });
  } else {
    // Remove the marker
    await deleteDoc(docRef);
  }
};
