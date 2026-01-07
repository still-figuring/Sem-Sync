import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile, UserRole } from "../types";

export const createUserProfile = async (
  uid: string,
  data: Omit<UserProfile, "uid">
) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    uid,
    ...data,
  });
  return { uid, ...data };
};

export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  } else {
    return null;
  }
};
