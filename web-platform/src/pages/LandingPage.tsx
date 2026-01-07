export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <main className="flex flex-col items-center gap-8 px-4 text-center">
        <div className="relative">
          <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary to-blue-600 opacity-25 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200"></div>
          <div className="relative flex items-center justify-center rounded-lg bg-card px-8 py-4 ring-1 ring-border">
            <span className="text-sm font-medium text-muted-foreground">
              v1.0.0 Alpha
            </span>
          </div>
        </div>

        <h1 className="text-6xl font-black tracking-tighter sm:text-7xl md:text-8xl">
          Sem<span className="text-primary">Sync</span>
        </h1>

        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          The central academic hub for students and instructors. Manage
          schedules, track deadlines, and collaborate in real-time.
        </p>

        <div className="flex gap-4">
          <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            Get Started
          </button>
          <button className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-transparent px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            Learn More
          </button>
        </div>
      </main>
    </div>
  );
}
