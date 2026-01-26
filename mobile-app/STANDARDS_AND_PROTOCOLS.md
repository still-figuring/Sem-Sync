# SemSync Project Standards & Protocols

This document defines the **Non-Negotiable Standards** for the Mobile Application team.
Since we are integrating with an existing platform, you must adhere to these standards to ensure the "SemSync" experience is consistent across Web and Mobile.

---

## 1. Brand Identity & UI Colors

To match the Web Dashboard, **Mobile App must use these exact RGB/Hex values** in `res/values/colors.xml`.

### Primary Palette (Purple/Indigo)

- **Primary (Light Mode):** `#7066E0` (RGB: 112, 102, 224) - _Use for Buttons, Toolbars, Icons_
- **Primary (Dark Mode):** `#8C85E6` (RGB: 140, 133, 230)

### Secondary Palette (Pink/Accent)

- **Secondary:** `#EA4C89` (RGB: 234, 76, 137) - _Use for Floating Action Buttons (FAB)_

### Status Colors

- **Success (Green):** `#10B981` (RGB: 16, 185, 129) - _Use for "Completed" tasks_
- **Warning (Orange):** `#F59E0B` (RGB: 245, 158, 11) - _Use for "Due Soon"_
- **Destructive (Red):** `#EF4444` (RGB: 239, 68, 68) - _Use for "Delete" or "Overdue"_

### Typography

- **Font Family:** Use `Roboto` (Android Default) or `Inter` (if you have time to import).
- **Titles:** Bold, Size 20sp+.
- **Body:** Regular, Size 14sp-16sp.

---

## 2. Data Consistency Protocol (Firestore)

**Rule:** Do not change Field Names. The Web App expects specific formatting.

### 📅 Timetable Objects

If you create or display a Class/Lesson, it **MUST** have these fields:

- `code` (string): e.g., "ICS 2200"
- `title` (string): e.g., "Introduction to Software"
- `day` (string): "Monday", "Tuesday", etc. (Full English name, capitalized)
- `startTime` (string): "08:00" (24h format)
- `endTime` (string): "10:00" (24h format)
- `location` (string): e.g., "Lab 1"

### ✅ Task Objects

- `status` (string): Use ONLY `"todo"`, `"in-progress"`, `"done"`.
- `priority` (string): Use ONLY `"low"`, `"medium"`, `"high"`.
- _Do not use Enums that save as 0, 1, 2. Save them as Strings._

---

## 3. AI Persona Standards (If Customizing)

If you are **NOT** using the Cloud Function and implementing a local fallback, you **MUST** configure the System Prompt to match our Web Persona.

**System Instructions:**

> "You are SemSync, an academic assistant for university students. You are helpful, encouraging, and concise. You help students manage their time and understand their deadlines. Always answer in a structured format."

**Tone:**

- Professional but approachable.
- Do not hallucinate classes. If you don't know the schedule, ask the user to check their calendar.

---

## 4. Git & Collaboration Rules

1.  **Branching:**
    - `main` = Stable (What we show in the demo).
    - `dev` = Integration (Where we merge everyone's work).
    - `feature/member-name` = Your personal workspace.

2.  **Commit Messages:**
    - Good: `feat: Added login screen layout`
    - Bad: `fixed stuff`

3.  **The "Emergency Button":**
    - If the App Crash on the morning of the demo:
    - **Revert** to the last commit tagged `stable-v1`.
    - Prioritize **Happy Path** (Login -> Dashboard -> Timetable) over new features.
