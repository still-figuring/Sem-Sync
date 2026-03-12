import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckSquare,
  Users,
  BookText,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Smart Timetable",
    description:
      "Sync your class schedule across devices. Import timetables with AI or add courses manually.",
  },
  {
    icon: CheckSquare,
    title: "Task Tracking",
    description:
      "Stay on top of assignments, CATs, and exams with unified task management.",
  },
  {
    icon: Users,
    title: "Class Groups",
    description:
      "Join your class group, get announcements from reps, and share resources.",
  },
  {
    icon: BookText,
    title: "Digital Notebook",
    description:
      "Take rich-text notes with auto-save. Search and organize by course.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <span className="text-lg font-bold tracking-tight">
            Sem<span className="text-primary">Sync</span>
          </span>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Now with AI timetable import
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-3xl mx-auto leading-[1.1]">
          Your semester, <span className="text-primary">organized</span>
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          The academic hub for students and instructors. Manage schedules, track
          deadlines, collaborate with your class — all in one place.
        </p>

        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-border bg-card p-6 transition-colors hover:bg-muted/40"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1.5">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>SemSync &mdash; Academic Organization Platform</span>
          <span>v1.0.0 Alpha</span>
        </div>
      </footer>
    </div>
  );
}
