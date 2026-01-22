import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from "firebase/functions";
import { app } from "./firebase"; // Ensure this exports your firebase 'app' instance

export interface TimetableEntry {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
  type: "lecture" | "tutorial" | "lab" | "other";
  lecturer: string;
}

export async function extractTimetableFromImage(
  file: File,
): Promise<TimetableEntry[]> {
  try {
    console.log("Starting secure cloud extraction...");

    // 1. Convert file to base64
    const base64Data = await fileToBase64(file);

    // 2. Call the Cloud Function
    // Ensure "extractTimetable" matches the export name in functions/index.js
    const functions = getFunctions(app);

    // Connect to Emulator if running locally
    if (location.hostname === "localhost") {
      // 127.0.0.1 is safer than "localhost" sometimes to avoid IPv6 issues
      connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    }

    const extractFunction = httpsCallable(functions, "extractTimetable");

    console.log("Sending to Cloud Function...");
    const result = await extractFunction({ image: base64Data }); // No generics here

    // Cast the unknown data to our type
    const data = result.data as TimetableEntry[];
    console.log("Cloud Function Success:", data);
    return data;
  } catch (error: any) {
    console.error("Cloud extraction failed:", error);
    throw new Error(error.message || "Failed to extract timetable.");
  }
}

// Simple helper to get base64 string without the "data:image/x;base64," prefix
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Split to get only the base64 part
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}
