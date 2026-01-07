### **Product Requirements Document (PRD): SemSync Web Platform**

**Project Name:** SemSync **Version:** 1.0 **Status:** Draft **Platform:** Web (React)

\+2  
---

### **1\. Executive Summary**

**SemSync** is a web-based platform designed to streamline academic organization for university students. While generic calendar apps exist, they lack academic-specific workflows. This application will serve as a central hub for students to upload semester schedules, receive timely notifications for classes and deadlines, and for instructors to communicate updates.

\+1

### **2\. Target Audience**

* **Students:** The primary users who need to manage timetables, track assignments, and receive reminders to improve academic performance.  
  \+1  
* **Instructors:** Users who need to communicate schedule changes (postponements) and share updates with the class.  
  \+1

### **3\. Core Objectives**

* **General:** To develop a student-focused application that streamlines academic organization by integrating reminders, schedules, and collaborative tools.  
* **Specific Objectives:**  
  * Enable students to upload or register their lesson plans at the start of the semester.  
  * Produce automated alerts for CATs, assignments, exams, and workshops.  
  * Facilitate class postponements and instructor communication.  
  * Provide a digital notebook for recording important lecture notes.

### **4\. Functional Requirements (Web)**

#### **4.1. User Authentication & Profile**

* **Requirement:** Secure sign-up and login for different user roles.  
* **Implementation:** Firebase Authentication.  
* **Features:**  
  * Student Registration/Login.  
  * Instructor Registration/Login.  
  * Profile Management (Name, Registration Number).

#### **4.2. Schedule & Timetable Management**

* **Goal:** Allow students to upload/register lesson plans.  
* **Features:**  
  * **Manual Entry Form:** Interface to input course codes, venues, and times.  
  * **Visual Calendar:** A weekly or monthly view of the semester schedule.  
  * **Edit/Delete:** Ability to modify class details if the semester plan changes.

#### **4.3. Academic Task Tracking**

* **Goal:** Highlight approaching due dates for tasks and assignments.  
* **Features:**  
  * **Task Dashboard:** A list view of pending assignments, CATs, and exams.  
  * **Deadline Entry:** Ability to tag tasks with specific dates and times.  
  * **Status Toggles:** Mark items as "Pending" or "Completed."

#### **4.4. Notifications & Alerts**

* **Goal:** Produce automated alerts for exams and assignments.  
* **Implementation:** Firebase Cloud Messaging (FCM).  
* **Features:**  
  * **In-App Notification Center:** A dedicated section on the web dashboard showing recent alerts.  
  * **Upcoming Deadlines:** Visual indicators for items due soon.

#### **4.5. Communication & Postponement System**

* **Goal:** Allow instructors to postpone classes and share updates.  
* **Features:**  
  * **Instructor Dashboard:** A view for instructors to manage their specific courses.  
  * **Postponement Tool:** A function to flag a specific class session as "Postponed" or "Rescheduled."  
  * **Announcement Board:** A collaborative space for sharing class updates.

#### **4.6. Digital Notebook**

* **Goal:** A component for recording lecture notes.  
* **Features:**  
  * **Rich Text Editor:** A web-based editor for typing notes.  
  * **Organization:** Notes linked to specific Course IDs or dates.

### **5\. Technical Specifications**

#### **5.1. Tech Stack**

* **Frontend:** React (Web).  
* **Backend:** Firebase.  
  * **Database:** Firestore (NoSQL) for data storage.  
  * **Authentication:** Firebase Auth.  
  * **Hosting:** Firebase Hosting.  
* **Notifications:** Firebase Cloud Messaging (FCM).  
* **Version Control:** GitHub.

#### **5.2. Data Requirements**

* **Users Collection:** Stores user profiles and roles.  
* **Schedules Collection:** Stores class times, venues, and recurrence rules.  
* **Tasks Collection:** Stores assignment details and deadlines.  
* **Notes Collection:** Stores text content linked to the user and subject.

### **6\. Success Metrics**

* Successful synchronization of data between the web dashboard and the Firebase database.  
* Accurate delivery of notifications/alerts for upcoming deadlines.  
* Functional "Postponement" feature that instantly updates the student view.

