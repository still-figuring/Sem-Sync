import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckSquare,
  Users,
  BookText,
  ArrowRight,
  Sparkles,
  Smartphone,
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
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-3xl mx-auto leading-tight">
          Manage your academic schedule with{" "}
          <span className="text-primary">clarity</span>
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          A centralized platform for students to track classes, assignments, and
          stay synced with their university groups.
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

      {/* Mobile App Teaser */}
      <section className="border-t border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="md:w-1/2 text-center md:text-left">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-6">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Take SemSync on the Go
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Never miss a class announcement or test deadline again. The
              SemSync mobile application is currently under development for iOS
              and Android.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Coming Soon in Alpha
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center md:justify-end opacity-80 decoration-muted">
            {/* Mockup or Illustration Placeholder */}
            <div className="relative w-64 h-[28rem] rounded-[2rem] border-8 border-border bg-card shadow-2xl flex items-center justify-center overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-6 bg-border w-1/3 mx-auto rounded-b-xl" />
              <div className="text-center px-6">
                <Smartphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  Mobile App Appears Here
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-background">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>SemSync &mdash; Academic Organization Platform</span>
          <span>v1.0.0 Alpha</span>
        </div>
      </footer>
    </div>
  );
}
