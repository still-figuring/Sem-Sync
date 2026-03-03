# SemSync Mobile Application — Project Report (Summary)

**Course:** ICS 2300 — Mobile Applications Design and Development
**Application Name:** SemSync | **Platform:** Android (Kotlin) | **IDE:** Android Studio

---

## 1. Problem Identification

University students manage their academic workload using fragmented tools — WhatsApp groups (where announcements are buried in chat), generic calendar apps (no course-code awareness), and paper timetables (static, no real-time updates). There is no centralized, student-focused mobile platform that integrates scheduling, task tracking, group collaboration, and notifications for the university context.

**Impact:** Missed deadlines, unattended classes due to schedule changes, and significant cognitive overhead from context-switching between apps.

**Solution:** SemSync — an Android app serving as a central academic hub where students view their schedule, track tasks, collaborate in class groups, and receive real-time notifications from a single interface.

---

## 2. Design Process

### User Roles

- **Students** — View schedules, track tasks, join groups, receive notifications.
- **Class Representatives** — Manage group units/schedules, post announcements.
- **Instructors** — Communicate updates and schedule changes.

### Navigation Architecture

Bottom navigation with 6 tabs: **Home** (dashboard), **Timetable**, **Tasks**, **Groups**, **Notes**, **AI Chat**. Secondary screens include Notifications (from dashboard bell icon) and Group Detail (from group card tap).

### UI/UX Principles

- **Dark-first theme** (`#1E1E1E` background) for reduced eye strain during study sessions.
- **Card-based layout** with rounded corners for visual hierarchy.
- **Color-coded priorities:** Red (high), Amber (medium), Green (low).
- **Progressive disclosure:** Dashboard shows summaries; tap through for full lists.
- **Role-based UI:** Rep-only actions (add/delete units) hidden from regular members.

### Data Model (Firestore NoSQL)

- `users/{uid}` — Profile (name, email, role) + `/notes` subcollection.
- `groups/{id}` — Group metadata + `/posts` (announcements) + `/units` (course schedules).
- `tasks/{id}` — Personal tasks filtered by `userId`.

---

## 3. Development Steps

### 3.1 Setup

Android Studio project with Kotlin, ViewBinding, Firebase BOM (Auth, Firestore, FCM), Jetpack Navigation, WorkManager, OkHttp, and Kotlin Coroutines. Min SDK 24, target SDK 36.

### 3.2 Authentication

- **Email/password** sign-up (with role selection) and sign-in via Firebase Auth.
- **Google Sign-In** via OAuth with auto-profile creation in Firestore.
- Auto-login on app relaunch if session exists.

### 3.3 Home Dashboard

Aggregates four data sources into one screen:

1. **Today's Schedule** — Queries group units, finds the next _unfinished_ class (not just the first one). Falls back to tomorrow if all classes are done.
2. **Tasks Due Soon** — Top 3 incomplete tasks by due date with relative time labels.
3. **Recent Announcements** — Latest 5 posts aggregated from all joined groups.
4. **Quick Nav Buttons** — Shortcuts to Timetable, Tasks, Notes, and Notifications.

### 3.4 Timetable

Weekly view with 7 day-tabs. Dynamically populated from all joined groups' unit schedules. Add-class dialog for personal entries.

### 3.5 Task Management

Full CRUD with real-time Firestore snapshot listener. Filter tabs (To Do / Completed / All). Priority color chips, overdue detection, checkbox completion toggle, and delete.

### 3.6 Academic Groups

- **Groups List:** Real-time subscription. Join via 6-character code → added to members array + FCM topic subscription.
- **Group Detail (3 tabs):**
  - _Updates:_ Post creation + real-time feed.
  - _Schedule:_ Unit management (rep-only add/delete) with embedded day/time/location.
  - _Resources:_ Placeholder UI (future implementation).

### 3.7 Notifications (Dual-Layer)

- **In-App Feed:** Coroutine-based aggregation of up to 20 posts per group, sorted newest-first.
- **Background Worker:** `AnnouncementCheckWorker` (WorkManager, every 15 min) checks for new posts → sends local notifications.
- **FCM Push:** Cloud Function triggers on new post creation → pushes to group topic.

### 3.8 AI Chat

Chat interface calling a Firebase Cloud Function (Google Gemini 1.5 Flash) via OkHttp. The function injects user academic context as a system prompt.

### 3.9 Notebook

Read-only list of user's notes from Firestore (`users/{uid}/notes`), ordered by last modified date.

---

## 4. Core Features

| #   | Feature                     | Description                                                                 |
| --- | --------------------------- | --------------------------------------------------------------------------- |
| F1  | **Smart Dashboard**         | Aggregated view of schedule, tasks, and announcements with next-class logic |
| F2  | **Academic Groups**         | Join via code, rep-managed units populate members' timetables automatically |
| F3  | **Task Management**         | CRUD with priorities, filters, due dates, and overdue detection             |
| F4  | **Real-Time Notifications** | Background polling + FCM push + in-app feed                                 |
| F5  | **Weekly Timetable**        | Dynamic schedule from all group units, day-by-day tabs                      |
| F6  | **AI Chat**                 | Gemini-powered contextual academic assistant                                |

---

## 5. Technical Architecture

**Pattern:** Fragment-based single-activity (post-auth). Two auth Activities → MainActivity with NavHostFragment hosting 9 destinations.

**Stack:** Kotlin, ViewBinding, Firebase (Auth + Firestore + FCM), WorkManager, OkHttp, Coroutines, Jetpack Navigation.

**Async:** Callback-based Firestore listeners (dashboard, tasks, groups) + Coroutines with `await()` (notifications, background worker).

**Offline:** Firestore `PersistentCacheSettings` enables full offline read access.

**Security:** Firebase Auth identity → Firestore rules (owner-only for tasks/notes, member-based for groups, rep-only for unit writes) → UI-level action visibility.

---

## 6. Testing and Evaluation

### Functional Testing (18 test cases — all passing)

Key cases: registration, sign-in (email + Google), dashboard schedule logic (next-class + tomorrow fallback), group join (valid + invalid code), post creation, task CRUD (add/complete/delete), timetable day filtering, notification delivery, AI chat response, offline access.

### Usability Testing (8 university students)

| Task                | Success Rate | Avg. Time |
| ------------------- | ------------ | --------- |
| Sign up             | 100%         | 45s       |
| Join group          | 87.5%        | 30s       |
| View schedule       | 100%         | 5s        |
| Create task         | 100%         | 35s       |
| Check notifications | 75%          | 15s       |

**Feedback:** Users praised the unified academic view and auto-populated timetable. Identified that the notebook is read-only and the notification bell icon could be more discoverable.

### Performance

| Metric                  | Result |
| ----------------------- | ------ |
| Cold startup            | ~2.1s  |
| Dashboard load (cached) | ~1.4s  |
| Memory usage            | ~95 MB |
| APK size                | ~18 MB |

### Improvements Made

- Fixed dashboard to show next _unfinished_ class instead of first class of the day.
- Fixed "20507 days ago" timestamp bug by prioritizing server timestamp over client timestamp.
- Added full notifications screen (was previously limited to 5 items on dashboard).

---

## 7. Challenges and Solutions

| Challenge                                                                   | Solution                                                                                      |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Timestamp inconsistency (Server vs. client timestamps causing "20507d ago") | Dual-field model: check `timestamp` first, fall back to `createdAt`, default to now           |
| Cross-group data aggregation (nested callbacks)                             | Migrated to Kotlin Coroutines with `await()` for notifications; counter pattern for dashboard |
| Background worker reliability (Doze mode delays)                            | Supplemented WorkManager with FCM topic-based push notifications                              |
| Role capitalization mismatch between platforms                              | Web normalizes roles to lowercase on auth state change                                        |
| Firestore composite index requirements                                      | Fallback query patterns + incremental index creation via console                              |

---

## 8. Future Enhancements

**High:** Profile screen, notebook write support, resources tab implementation, production AI chat URL.
**Medium:** Forgot password flow, personal timetable persistence fix, MVVM architecture refactor.
**Low:** Dark/light theme toggle, Safe Args navigation, search functionality, tablet layouts.

---

## 9. Conclusion

SemSync implements **six core features** (exceeding the requirement of three) to solve fragmented academic communication. The app demonstrates Firebase-backed real-time sync, offline-first design, push notifications, and role-based access control. User testing with 8 students confirmed strong usability (75–100% task success rates) and validated the core value proposition of a unified academic hub. The dual-layer notification system (FCM + WorkManager) ensures students never miss critical announcements.

**Repository:** [github.com/still-figuring/Sem-Sync](https://github.com/still-figuring/Sem-Sync) (`mobile-app/` directory)
