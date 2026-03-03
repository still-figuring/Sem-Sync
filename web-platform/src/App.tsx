import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { getUserProfile, createUserProfile } from "./lib/auth";
import { useAuthStore } from "./store/authStore";
import { ThemeProvider } from "./hooks/useTheme";
import type { UserProfile } from "./types";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import TimetablePage from "./pages/dashboard/TimetablePage";
import TasksPage from "./pages/dashboard/TasksPage";
import NotebookPage from "./pages/dashboard/NotebookPage";
import GroupsPage from "./pages/dashboard/GroupsPage";
import GroupDetailPage from "./pages/dashboard/GroupDetailPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import InstructorDashboard from "./pages/dashboard/InstructorDashboard";

// Layouts & Auth
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  const { setUser, setIsLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          let profile = await getUserProfile(firebaseUser.uid);

          // RECOVERY: If Auth exists but Firestore profile is missing
          if (!profile) {
            console.warn("User profile missing. Creating default profile...");
            const newProfile: Omit<UserProfile, "uid"> = {
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "Student",
              role: "student",
              createdAt: Date.now(),
            };
            await createUserProfile(firebaseUser.uid, newProfile);
            profile = { uid: firebaseUser.uid, ...newProfile };
          }

          // COMPATIBILITY: Fix Capitalized roles from Mobile App
          if (profile && profile.role) {
            const normalizedRole = profile.role.toLowerCase() as
              | "student"
              | "instructor";
            if (profile.role !== normalizedRole) {
              profile.role = normalizedRole;
            }
          }

          setUser(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null); // Force logout on critical error
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setIsLoading]);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes (Dashboard) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/groups/:groupId" element={<GroupDetailPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/notebook" element={<NotebookPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/instructor" element={<InstructorDashboard />} />
            </Route>
          </Route>

          {/* Catch all - Redirect to 404 or Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
