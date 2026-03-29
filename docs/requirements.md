# Habit Tracker - System Requirements

## 1. Functional Requirements

### FR1. User Registration
The system shall allow a new user to register an account using email, username, and password.

### FR2. User Login
The system shall allow a registered user to log in using valid credentials.

### FR3. User Logout
The system shall allow an authenticated user to log out of the application.

### FR4. User Authentication
The system shall restrict access to protected resources so that only authenticated users can access their own data.

### FR5. Habit Creation
The system shall allow a user to create a habit with a title, description, habit type, frequency type, and optional category.

### FR6. Habit Update
The system shall allow a user to edit an existing habit.

### FR7. Habit Archive
The system shall allow a user to archive a habit by setting it as inactive.

### FR8. Habit Type Support
The system shall support two habit types:
- `COMPLETED`
- `NUMERIC`

### FR9. Numeric Habit Configuration
The system shall allow a `NUMERIC` habit to define a target value and unit.

### FR10. Frequency Type Support
The system shall support two frequency types:
- `DAILY`
- `SELECTED_DAYS`

### FR11. Selected Days Scheduling
The system shall allow a user to define one or more selected weekdays for habits using the `SELECTED_DAYS` frequency type.

### FR12. Daily Habit Tracking
The system shall allow a user to log progress for a habit on a specific date.

### FR13. One Entry Per Day
The system shall allow at most one habit entry per habit per day.

### FR14. Completed Habit Entry Tracking
The system shall allow a user to mark a `COMPLETED` habit as completed or missed.

### FR15. Numeric Habit Entry Tracking
The system shall allow a user to enter a numeric achieved value for a `NUMERIC` habit.

### FR16. Entry Status Evaluation
The system shall store or derive entry status values such as completed, missed, or partial based on habit type and recorded progress.

### FR17. Dashboard View
The system shall provide a dashboard displaying habits scheduled for the current day and their current progress.

### FR18. Habit History View
The system shall allow a user to view the history of entries for a specific habit.

### FR19. Streak Tracking
The system shall calculate and display the current streak and longest streak for each habit.

### FR20. Progress Statistics
The system shall provide basic statistics for each habit, such as completion rate and entry history.

### FR21. Category Management
The system shall allow a user to create and manage categories for organizing habits.

### FR22. Habit Categorization
The system shall allow a user to assign a category to a habit.

### FR23. Reminder Management
The system shall allow a user to create, update, enable, and disable reminders for a habit.

### FR24. User Preferences
The system shall allow a user to manage preferences such as theme mode and notification settings.

### FR25. Data Export
The system shall allow a user to export their habit tracking data in CSV format.

---

## 2. Non-Functional Requirements

### NFR1. Security
The system shall store passwords securely and protect authenticated endpoints.

### NFR2. Data Privacy
The system shall ensure that a user can only access their own habits, entries, categories, reminders, and preferences.

### NFR3. Usability
The system shall provide a simple and intuitive interface for daily habit tracking.

### NFR4. Performance
The system shall respond to normal user actions, such as login, dashboard loading, habit creation, and entry logging, within an acceptable time.

### NFR5. Reliability
The system shall store user data consistently and prevent duplicate habit entries for the same habit and date.

### NFR6. Maintainability
The system shall be implemented using a modular and maintainable architecture.

### NFR7. Scalability
The system shall be designed so that additional features can be added in the future without major architectural changes.

### NFR8. Portability
The system shall be deployable using container technologies such as Docker.

### NFR9. Cross-Device Access
The system shall allow authenticated users to access their data from different devices through a web browser.

### NFR10. Theme Support
The system shall support multiple theme modes through stored user preferences.
