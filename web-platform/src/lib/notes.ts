import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  lastModified: number;
}

export const subscribeToNotes = (
  userId: string,
  callback: (notes: Note[]) => void
) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const notesRef = collection(db, "users", userId, "notes");
  // Sort by lastModified descending (newest first)
  const q = query(notesRef, orderBy("lastModified", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const notes = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as Note;
      });
      callback(notes);
    },
    (error) => {
      console.error("Error subscribing to notes:", error);
    }
  );
};

export const createNote = async (userId: string) => {
  const notesRef = collection(db, "users", userId, "notes");
  const newNote = {
    userId,
    title: "", // Empty start
    content: "",
    lastModified: Date.now(), // Use client timestamp for immediate sort, or serverTimestamp for consisteny
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(notesRef, newNote);
  return docRef.id;
};

export const updateNote = async (
  userId: string,
  noteId: string,
  data: Partial<Note>
) => {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await updateDoc(noteRef, {
    ...data,
    lastModified: Date.now(),
  });
};

export const deleteNote = async (userId: string, noteId: string) => {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await deleteDoc(noteRef);
};
