# SemSync Android Application

## 📱 Project Overview

This represents the mobile channel for the SemSync platform. While the Web App is for deep work (management, typing notes), the Mobile App is for **consumption and quick reference** (checking effective schedule, quick task capture, and AI assistance).

**Deadline Context:** Presentation is tomorrow. The goal is **Simplicity** and **Stability**. Do not over-engineer.

## 🎯 The 3 Core Features

### 1. The Smart Dashboard (Home)

- **What it does:** Shows the _immediate_ context.
- **UI:**
  - A "Now/Next" Card showing the current or upcoming class (Time, Venue, Code).
  - A "Due Soon" summary (e.g., "2 Assignments due tommorrow").
- **Why:** Students open the app while walking to class to check the room number.

### 2. Timetable Viewer

- **What it does:** A clean list view of the week's schedule.
- **UI:** A Tab layout (Mon, Tue, Wed...) or a simple vertical scroll.
- **Data Source:** Pulls from `users/{uid}/timetable` in Firestore.

### 3. SemSync AI Assistant (Gemini)

- **What it does:** A chat interface where students can ask questions.
- **Why:** Differentiator feature. "Where is my next class?", "Help me plan my study time".
- **Tech:** Connects to our existing Firebase Cloud Function.

---

## 👥 Team Roles & Distribution (6 Members)

**Important:** Before starting, everyone must read [STANDARDS_AND_PROTOCOLS.md](STANDARDS_AND_PROTOCOLS.md) to ensure we use the same colors, fonts, and data structures.

**Goal:** Work in parallel. Avoid touching the same XML/Kotlin files.

### 👷 Member 1: Project Lead & Auth (The Anchor)

- **Responsibilities:**
  - Initialize the Android Studio Project.
  - Set up Firebase (download `google-services.json`).
  - Implement Login/Sign-up Screens (use Firebase Auth UI if possible to save time).
  - Handle Navigation (Bottom Navigation creation).

### 🎨 Member 2: Dashboard Implementation

- **Responsibilities:**
  - Create the `HomeFragment`.
  - Design the "Next Class" Card widget.
  - Fetch basic user data (Name, Greeting).
  - **Constraint:** Hardcode the data first to get UI ready, then replace with real data when Member 6 is ready.

### 📅 Member 3: Timetable Feature

- **Responsibilities:**
  - Create `TimetableFragment`.
  - Implement a `RecyclerView` to display classes.
  - Implement Day filtering (Mon-Fri).
  - **Data source:** Read from standard Firestore collection.

### ✅ Member 4: Task Manager

- **Responsibilities:**
  - Create `TasksFragment`.
  - List tasks with a Checkbox.
  - a generic "Add Task" Floating Action Button (FAB).
  - **Simplification:** Don't implement complex sorting. Just a list.

### 🤖 Member 5: AI Chat UI

- **Responsibilities:**
  - Create `AiChatFragment`.
  - Build a chat layout (Recycler view with "UserMessage" and "BotMessage" bubbles).
  - Handle input field and "Send" button state.

### 🔌 Member 6: Backend & AI Logic (The Bridge)

- **Responsibilities:**
  - Write the `GeminiRepository` class.
  - Handle the HTTP networking to call our Cloud Function (see `GEMINI_INTEGRATION.md`).
  - Assist Members 3 & 4 with Firestore queries if they get stuck.
  - **Quality Control:** Run the app on an actual specific device to ensure demo goes smoothly.

---

## 🚀 getting Started

1. **Clone** the repo.
2. Open **Android Studio**.
3. **Product Manager** (Member 1) adds the `google-services.json` file to the `app/` folder.
4. **Member 6** ensures the Cloud Function URL is accessible.

## 🛠 Tech Stack Guidelines used

- **Language:** Kotlin (Recommended for speed) or Java (Only if team is more comfortable).
- **UI:** XML Layouts (Standard Views). **DO NOT use Jetpack Compose** (Too high learning curve for 24h).
- **Architecture:** MVVM (Model-View-ViewModel).
  - _Keep it simple_: Activity -> ViewModel -> Firestore.
- **Async:** Coroutines (`suspend` functions).

## ⚠️ "Hackathon" Rules

1. **Mock it 'til you make it:** If the Tasks API is breaking 1 hour before demo, hardcode 3 tasks in the user interface. A working demo is better than broken code.
2. **One Happy Path:** Focus on the specific flow you will show in the presentation. Don't handle every error edge case.
3. **Commit Often:** Don't keep code on your laptop. Push every hour.
