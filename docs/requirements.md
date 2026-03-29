# Habit Tracker - Requirements

## 1. Project Description

Habit Tracker is a SaaS-style web application that helps users build good habits, reduce bad habits, and track their daily progress in a simple and motivating way.

Users can create personal habits, define schedules, log their progress, view streaks and statistics, organize habits into categories, and configure reminders. The system is designed as a modern full-stack practice project to demonstrate professional software development using frontend, backend, database, and container technologies.

The application is intended to be accessible through a web browser and support authenticated user-specific data.

---

## 2. Functional Requirements

### FR1. User registration and login
The system shall allow users to create an account, log in, and log out securely.

### FR2. User authentication
The system shall protect private user data and only allow authenticated users to access their own habits, entries, dashboard, and preferences.

### FR3. Habit creation
The system shall allow users to create a habit with a title, description, habit type, category, target value, unit, and schedule.

### FR4. Habit update
The system shall allow users to edit an existing habit.

### FR5. Habit archive
The system shall allow users to archive a habit by setting it as inactive instead of deleting it permanently.

### FR6. Habit types
The system shall support two habit types:
- `COMPLETED` for habits tracked as done or not done
- `NUMERIC` for habits tracked by a measurable value

### FR7. Habit scheduling
The system shall allow users to configure habit frequency using:
- `DAILY`
- `SELECTED_DAYS`

### FR8. Habit tracking
The system shall allow users to log one progress entry per habit per day.

### FR9. Entry status tracking
The system shall allow users to record habit progress using entry statuses such as completed, missed, or partial, depending on the habit type.

### FR10. Numeric progress tracking
For `NUMERIC` habits, the system shall allow users to store a numeric achieved value for a given day.

### FR11. Dashboard
The system shall provide a dashboard showing the user’s habits scheduled for today and their current progress.

### FR12. Streak tracking
The system shall calculate and display the current streak and longest streak for each habit.

### FR13. Statistics and history
The system shall provide progress statistics and historical tracking data for each habit.

### FR14. Habit categories
The system shall allow users to organize habits into categories.

### FR15. Reminder management
The system shall allow users to configure reminders for habits.

### FR16. User preferences
The system shall allow users to manage personal preferences such as theme mode and notification settings.

### FR17. Data export
The system shall allow users to export habit data to CSV format.

---

## 3. Non-Functional Requirements

### NFR1. Security
The system shall store passwords securely and protect authenticated endpoints.

### NFR2. Data isolation
The system shall ensure that each user can only access their own data.

### NFR3. Usability
The system shall provide a simple and intuitive interface for daily habit tracking.

### NFR4. Performance
The system shall return normal user requests such as dashboard loading, habit listing, and entry logging within an acceptable response time.

### NFR5. Maintainability
The system shall follow a clean and modular architecture to support future extension and maintenance.

### NFR6. Scalability
The system shall be designed in a way that supports future feature growth and deployment improvements.

### NFR7. Portability
The system shall be containerizable and runnable in a consistent development and deployment environment.

### NFR8. Availability across devices
The system shall allow authenticated users to access their data from different devices through a web browser.

### NFR9. Reliability
The system shall preserve user habit data consistently in the database.

### NFR10. Theme support
The system shall support multiple theme modes through user preferences.

---

## 4. Technology Context

### Frontend
- React
- TypeScript

### Backend
- Spring Boot (Java)

### Database
- PostgreSQL

### DevOps / Deployment
- Docker
- Kubernetes

---

## 5. MVP Scope

The minimum viable product should include:

- user registration and login
- habit creation and editing
- daily habit tracking
- dashboard for today
- streak calculation
- basic statistics
- categories
- CSV export

Reminder delivery can be treated as a secondary feature if time becomes limited.