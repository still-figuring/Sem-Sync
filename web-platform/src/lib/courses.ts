import {
  collection,
  addDoc,
  onSnapshot,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Course } from "../types";

export const addCourse = async (
  userId: string,
  courseData: Omit<Course, "id" | "instructorId">
) => {
  const coursesRef = collection(db, "users", userId, "courses");
  await addDoc(coursesRef, {
    ...courseData,
    instructorId: userId, // Logic: If student adds it, they own the record
    createdAt: Date.now(),
  });
};

export const subscribeToCourses = (
  userId: string,
  callback: (courses: Course[]) => void
) => {
  const coursesRef = collection(db, "users", userId, "courses");
  const q = query(coursesRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const courses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];
      callback(courses);
    },
    (error) => {
      console.error("Error subscribing to courses:", error);
    }
  );
};

export const deleteCourse = async (userId: string, courseId: string) => {
  const courseRef = doc(db, "users", userId, "courses", courseId);
  await deleteDoc(courseRef);
};
