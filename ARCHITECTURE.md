# SemSync Architecture & Design Guide

Based on the research for the SemSync Web Platform, the following technical stack and design principles have been selected to ensure clarity, creativity, and performance.

## 1. Tech Stack

### Frontend Core
- **Framework:** [React](https://react.dev/) (via [Vite](https://vitejs.dev/)) for speed and modern tooling.
- **Language:** TypeScript for type safety and reduced runtime errors.
- **Routing:** [React Router 6](https://reactrouter.com/) for handling navigation between Dashboard, Timetable, etc.

### UI & Styling (Creative & Non-Generic)
- **Styling Engine:** [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.
- **Components:** [shadcn/ui](https://ui.shadcn.com/) (headless components built on Radix UI).
  - *Why?* Allows full customization of design tokens (border radius, animations) to avoid the "Bootstrap/MUI" generic look.
  - *Theme:* Custom "Academic" theme with "Study Blue" and "Alert Red".
- **Icons:** [Lucide React](https://lucide.dev/) for clean, consistent iconography.
- **Animation:** [Framer Motion](https://www.framer.com/motion/) for page transitions and micro-interactions (e.g., checking off tasks).

### State Management
- **Global Store:** [Zustand](https://github.com/pmndrs/zustand).
  - *Usage:* User session, current semester schedule data, UI states (sidebar open/close).
  - *Benefit:* Much simpler and lighter than Redux.
- **Server State:** Standard `useEffect` or `TanStack Query` (optional, for future caching).

### Specialized Features
- **Calendar:** [FullCalendar React](https://fullcalendar.io/docs/react).
  - *Usage:* Handling recurring class logic and drag-and-drop. Custom rendering for "Postponed" badges.
- **Rich Text:** [Tiptap](https://tiptap.dev/).
  - *Usage:* Headless editor for the "Digital Notebook".
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/).
  - *Usage:* Validating registration forms and schedule inputs.

## 2. System Design (Firebase + NoSQL)

### Data Modeling (Firestore)
- **`users/{userId}`**: Stores role (`student` | `instructor`) and settings.
- **`courses/{courseId}`**: Master definition of a class (name, instructor, recurring rules).
- **`sessions/{sessionId}`**: *Overrides only*. We don't store 15 weeks of classes. We generate the schedule on the client and check this collection for postponements/reschedules.
- **`tasks/{taskId}`**: Assignments and exams.
- **`notes/{noteId}`**: HTML/JSON content from Tiptap.

### Security (RBAC)
- **Rules:**
  - `read`: Generally open to authenticated users (or scoped to enrolled courses).
  - `write`: Strict. Students cannot edit `courses` or `sessions`. Only Instructors can create `sessions` (postponements) for their own courses.

## 3. UX & Visual Identity
- **Dashboard:** "Bento Grid" layout (modular, widget-like blocks).
- **Interactions:**
  - Optimistic updates (UI updates immediately when a task is checked).
  - Skeleton loaders instead of spinners.
  - Glassmorphism for modern depth effects.
