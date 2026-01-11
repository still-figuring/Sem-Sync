import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  onSnapshot,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";

// Resource categories for organization
export type ResourceCategory =
  | "lecture-notes"
  | "assignments"
  | "past-papers"
  | "textbooks"
  | "reference"
  | "other";

export const RESOURCE_CATEGORIES: Record<
  ResourceCategory,
  { label: string; icon: string }
> = {
  "lecture-notes": { label: "Lecture Notes", icon: "📝" },
  assignments: { label: "Assignments", icon: "📋" },
  "past-papers": { label: "Past Papers", icon: "📄" },
  textbooks: { label: "Textbooks", icon: "📚" },
  reference: { label: "Reference Materials", icon: "🔗" },
  other: { label: "Other", icon: "📁" },
};

export interface CourseResource {
  id: string;
  groupId: string;
  unitId: string;
  unitName: string;
  title: string;
  description?: string;
  category: ResourceCategory;
  fileUrl: string;
  storagePath: string;
  fileType: string; // MIME type
  fileName: string;
  fileSize: number; // bytes
  uploadedBy: string;
  uploadedByName: string;
  createdAt: any; // Timestamp
}

// File validation constants
export const FILE_VALIDATION = {
  maxSize: 25 * 1024 * 1024, // 25MB
  maxSizeLabel: "25MB",
  allowedTypes: {
    documents: {
      mimeTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
      ],
      extensions: [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
        ".txt",
      ],
    },
    images: {
      mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    },
    archives: {
      mimeTypes: ["application/zip", "application/x-rar-compressed"],
      extensions: [".zip", ".rar"],
    },
  },
} as const;

export const getAllowedMimeTypes = (): string[] => {
  const { documents, images, archives } = FILE_VALIDATION.allowedTypes;
  return [...documents.mimeTypes, ...images.mimeTypes, ...archives.mimeTypes];
};

export const validateFile = (
  file: File
): { valid: boolean; error?: string } => {
  // Size check
  if (file.size > FILE_VALIDATION.maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${FILE_VALIDATION.maxSizeLabel}. Please choose a smaller file.`,
    };
  }

  // Type check
  const allowedTypes = getAllowedMimeTypes();
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error:
        "File type not allowed. Accepted: PDF, Word, Excel, PowerPoint, images, and ZIP files.",
    };
  }

  // Extension check
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  const { documents, images, archives } = FILE_VALIDATION.allowedTypes;
  const allExtensions: string[] = [
    ...documents.extensions,
    ...images.extensions,
    ...archives.extensions,
  ];

  if (!allExtensions.includes(extension)) {
    return {
      valid: false,
      error: "File extension does not match allowed formats.",
    };
  }

  return { valid: true };
};

// Format bytes for display
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Upload progress interface
export interface UploadProgress {
  state: "running" | "paused" | "success" | "error" | "cancelled";
  progress: number; // 0-100
  bytesTransferred: number;
  totalBytes: number;
  error?: string;
}

export interface UploadController {
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

// 1. Upload File with Progress Tracking
export const uploadResourceWithProgress = (
  groupId: string,
  file: File,
  metadata: {
    unitId: string;
    unitName: string;
    title: string;
    description: string;
    category: ResourceCategory;
    uploadedBy: string;
    uploadedByName: string;
  },
  onProgress: (progress: UploadProgress) => void
): { promise: Promise<void>; controller: UploadController } => {
  // Validate file first
  const validation = validateFile(file);
  if (!validation.valid) {
    onProgress({
      state: "error",
      progress: 0,
      bytesTransferred: 0,
      totalBytes: file.size,
      error: validation.error,
    });
    return {
      promise: Promise.reject(new Error(validation.error)),
      controller: {
        pause: () => {},
        resume: () => {},
        cancel: () => {},
      },
    };
  }

  const storagePath = `groups/${groupId}/materials/${
    metadata.unitId
  }/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      uploadedBy: metadata.uploadedBy,
      title: metadata.title,
    },
  });

  const controller: UploadController = {
    pause: () => uploadTask.pause(),
    resume: () => uploadTask.resume(),
    cancel: () => uploadTask.cancel(),
  };

  const promise = new Promise<void>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress({
          state: snapshot.state === "paused" ? "paused" : "running",
          progress: Math.round(progress),
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
        });
      },
      (error) => {
        let errorMessage = "Upload failed. Please try again.";

        switch (error.code) {
          case "storage/unauthorized":
            errorMessage =
              "You do not have permission to upload files to this group.";
            break;
          case "storage/canceled":
            errorMessage = "Upload was cancelled.";
            break;
          case "storage/quota-exceeded":
            errorMessage = "Storage quota exceeded. Please contact support.";
            break;
          default:
            console.error("Upload error:", error);
        }

        onProgress({
          state: error.code === "storage/canceled" ? "cancelled" : "error",
          progress: 0,
          bytesTransferred: 0,
          totalBytes: file.size,
          error: errorMessage,
        });

        reject(new Error(errorMessage));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          const resourceData = {
            groupId,
            ...metadata,
            fileUrl: downloadURL,
            storagePath,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            createdAt: serverTimestamp(),
          };

          await addDoc(
            collection(db, "groups", groupId, "resources"),
            resourceData
          );

          onProgress({
            state: "success",
            progress: 100,
            bytesTransferred: file.size,
            totalBytes: file.size,
          });

          resolve();
        } catch (firestoreError) {
          // Cleanup: delete the uploaded file if Firestore save fails
          try {
            await deleteObject(storageRef);
          } catch (cleanupError) {
            console.error(
              "Failed to cleanup after Firestore error:",
              cleanupError
            );
          }

          onProgress({
            state: "error",
            progress: 0,
            bytesTransferred: 0,
            totalBytes: file.size,
            error: "Failed to save resource metadata. Please try again.",
          });

          reject(firestoreError);
        }
      }
    );
  });

  return { promise, controller };
};

// Legacy simple upload (for backward compatibility)
export const uploadResource = async (
  groupId: string,
  file: File,
  metadata: {
    unitId: string;
    unitName: string;
    title: string;
    description: string;
    uploadedBy: string;
    uploadedByName?: string;
    category?: ResourceCategory;
  }
) => {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const storagePath = `groups/${groupId}/materials/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file);
  await uploadTask;
  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

  const resourceData = {
    groupId,
    ...metadata,
    category: metadata.category || "other",
    uploadedByName: metadata.uploadedByName || "Unknown",
    fileUrl: downloadURL,
    storagePath,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    createdAt: serverTimestamp(),
  };

  await addDoc(collection(db, "groups", groupId, "resources"), resourceData);
};

// 2. Subscribe to Resources
export const subscribeToResources = (
  groupId: string,
  callback: (resources: CourseResource[]) => void
) => {
  const q = query(
    collection(db, "groups", groupId, "resources"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const resources = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CourseResource[];
      callback(resources);
    },
    (error) => {
      console.error("Error subscribing to resources:", error);
    }
  );
};

// 3. Delete Resource
export const deleteResource = async (
  groupId: string,
  resourceId: string,
  storagePath: string
) => {
  // A. Delete from Storage
  const storageRef = ref(storage, storagePath);
  try {
    await deleteObject(storageRef);
  } catch (err) {
    console.error(
      "Error deleting file from storage (might already be gone):",
      err
    );
  }

  // B. Delete from Firestore
  const docRef = doc(db, "groups", groupId, "resources", resourceId);
  await deleteDoc(docRef);
};
