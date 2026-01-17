# SemSync Web Platform

SemSync is a specialized web-based platform designed to streamline academic organization for university students and instructors. Unlike generic calendar applications, SemSync offers academic-specific workflows including shared class schedules, group resource management, and automated deadline tracking.

This repository contains the React-based frontend application powered by Firebase.

## Key Features

### for Students

- **Dashboard**: Get a "at a glance" view of today's classes and pending tasks.
- **Interactive Timetable**: Manage personal courses and view synchronized group schedules using a calendar interface.
- **Academic Groups**: Join class groups using unique codes to access shared schedules and resources.
- **Task Management**: Track assignments, CATs, and exams with priority levels and status tracking.
- **Digital Notebook**: A rich-text editor for taking and organizing lecture notes.
- **Resource Sharing**: Download learning materials (PDFs, slides) uploaded by Class Reps.

### for Class Representatives & Instructors

- **Group Management**: Create academic groups and generate join codes for students.
- **Schedule Management**: Add recurring units and classes that automatically sync to all group members.
- **Announcements**: Post important updates (postponements, venue changes) that trigger notifications.
- **Resource Upload**: Share academic files directly to the group.

## Technology Stack

- **Frontend**: React (v19), TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/Radix UI Primitives, Lucide Icons
- **State Management**: Zustand
- **Backend (Serverless)**: Firebase
  - **Authentication**: secure sign-up/login
  - **Firestore**: NoSQL database for real-time data sync
  - **Storage**: File storage for academic resources
- **Calendar**: FullCalendar
- **Rich Text**: TipTap
- **AI Integration**: Google Gemini 1.5 Flash (Client-side) for timetable parsing

## Prerequisites

Before running the project, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/semsync-web.git
   cd semsync-web
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add your Firebase and Google AI configuration keys.

   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # Google AI (Gemini) Configuration
   VITE_GOOGLE_AI_KEY=your_gemini_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## Project Structure

```text
src/
├── components/        # Reusable UI components
│   ├── auth/          # Protected routes and auth forms
│   ├── groups/        # Group management dialogs
│   ├── layout/        # Sidebar, Navbar, and Shell
│   ├── tasks/         # Task creation and list views
│   └── timetable/     # Calendar-related components
├── hooks/             # Custom React hooks (Theme, etc.)
├── lib/               # Utility functions and API services
│   ├── ai.ts          # Gemini AI integration
│   ├── firebase.ts    # Firebase initialization
│   ├── groups.ts      # Group Data API
│   └── utils.ts       # Helper functions
├── pages/             # Main application views/routes
│   ├── auth/          # Login/Register pages
│   └── dashboard/     # Core feature pages
├── store/             # Global state (Zustand)
└── types/             # TypeScript interfaces
```

## Usage Guide

### Joining a Group

1. Navigate to the **My Classes** page.
2. Click **Join Group** and enter the 6-character code provided by your Class Rep.
3. The group's schedule will automatically merge with your personal timetable.

### Managing a Timetable (Class Reps)

1. Go to the **Group Details** page.
2. Select the **Units & Schedule** tab.
3. Click **Add New Unit** to define a class. This will populate the calendar for all members.

### Uploading Resources

1. In the **Group Details** page, select the **Resources** tab.
2. (Rep Only) Fill out the upload form to share PDFs or documents.
3. Students can view and download these files immediately.

## Contributing

1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

Distributed under the MIT License. See `LICENSE` for more information.
