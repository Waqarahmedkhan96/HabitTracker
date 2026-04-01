# Habit Tracker - Use Cases

## 1. Overview

This document describes the main user interactions supported by the Habit Tracker system.

The primary actor is:

- **User** - a registered person who uses the system to manage and track habits

---

## 2. Use Cases

## UC1. Register account

### Primary Actor
User

### Goal
Create a new account in the system.

### Preconditions
- The user is not logged in.
- The email is not already in use.

### Main Flow
1. The user opens the registration page.
2. The user enters email, username, password, first name, and last name.
3. The user submits the form.
4. The system validates the input.
5. The system creates a new user account.
6. The system confirms successful registration.

### Postconditions
- A new user account exists in the system.

---

## UC2. Log in

### Primary Actor
User

### Goal
Access the system using valid credentials.

### Preconditions
- The user already has an account.
- The account is enabled.

### Main Flow
1. The user opens the login page.
2. The user enters email and password.
3. The user submits the form.
4. The system validates the credentials.
5. The system authenticates the user.
6. The system returns an access token/session.
7. The user is redirected to the dashboard.

### Postconditions
- The user is authenticated.
- The user can access protected system features.

---

## UC3. Create habit

### Primary Actor
User

### Goal
Define a new habit to be tracked.

### Preconditions
- The user is logged in.

### Main Flow
1. The user opens the create habit form.
2. The user enters:
   - title
   - description
   - habit type
   - category
   - target value and unit if needed
   - frequency type
   - selected days if needed
3. The user submits the form.
4. The system validates the data.
5. The system creates the habit as active.
6. The system saves the habit under the current user.

### Postconditions
- A new habit exists and belongs to the user.

---

## UC4. Edit habit

### Primary Actor
User

### Goal
Update an existing habit.

### Preconditions
- The user is logged in.
- The habit belongs to the user.

### Main Flow
1. The user opens the habit details or edit form.
2. The user changes one or more habit fields.
3. The user submits the changes.
4. The system validates the new data.
5. The system updates the habit.

### Postconditions
- The habit contains updated information.

---

## UC5. Archive habit

### Primary Actor
User

### Goal
Stop tracking a habit without deleting its history.

### Preconditions
- The user is logged in.
- The habit belongs to the user.

### Main Flow
1. The user chooses to archive a habit.
2. The system sets the habit as inactive.
3. The system keeps past entries and statistics.

### Postconditions
- The habit is inactive.
- Historical tracking data remains stored.

---

## UC6. Log daily habit progress

### Primary Actor
User

### Goal
Record progress for a habit on a specific day.

### Preconditions
- The user is logged in.
- The habit belongs to the user.
- The habit is active.

### Main Flow for COMPLETED habit
1. The user opens today's dashboard or habit details.
2. The user selects a date or uses the current date.
3. The user marks the habit as completed or missed.
4. The system validates the entry.
5. The system creates or updates the daily entry.

### Main Flow for NUMERIC habit
1. The user opens today's dashboard or habit details.
2. The user selects a date or uses the current date.
3. The user enters the achieved numeric value.
4. The system evaluates the status based on the target value.
5. The system creates or updates the daily entry.

### Postconditions
- One daily entry exists for that habit and date.

---

## UC7. View dashboard

### Primary Actor
User

### Goal
See today’s habits and progress in one place.

### Preconditions
- The user is logged in.

### Main Flow
1. The user opens the dashboard.
2. The system loads habits scheduled for today.
3. The system loads today’s entries.
4. The system displays:
   - scheduled habits
   - current statuses
   - progress summary
   - streak information

### Postconditions
- The user can review and manage today’s habit progress.

---

## UC8. View habit statistics

### Primary Actor
User

### Goal
Analyze long-term habit progress.

### Preconditions
- The user is logged in.
- The habit belongs to the user.

### Main Flow
1. The user opens a habit details page.
2. The system loads habit history.
3. The system calculates and displays:
   - current streak
   - longest streak
   - completion rate
   - historical entries
4. The user reviews the statistics.

### Postconditions
- The user can understand progress over time.

---

## UC9. Manage categories

### Primary Actor
User

### Goal
Organize habits into personal categories.

### Preconditions
- The user is logged in.

### Main Flow
1. The user creates, edits, or deletes a category.
2. The system validates the category data.
3. The system stores the category under the current user.
4. The user assigns a category to habits.

### Postconditions
- Categories are available for habit organization.

---

## UC10. Configure reminders

### Primary Actor
User

### Goal
Define reminder settings for a habit.

### Preconditions
- The user is logged in.
- The habit belongs to the user.

### Main Flow
1. The user opens reminder settings for a habit.
2. The user chooses reminder time and applicable days.
3. The user enables or disables the reminder.
4. The system stores the reminder configuration.

### Postconditions
- Reminder settings exist for the selected habit.

---

## UC11. Manage user preferences

### Primary Actor
User

### Goal
Adjust personal application settings.

### Preconditions
- The user is logged in.

### Main Flow
1. The user opens preferences or profile settings.
2. The user changes settings such as theme mode or notifications.
3. The user saves the changes.
4. The system stores the updated preferences.

### Postconditions
- The user preferences are updated.

---

## UC12. Export data to CSV

### Primary Actor
User

### Goal
Download stored habit data for external use.

### Preconditions
- The user is logged in.

### Main Flow
1. The user chooses the export option.
2. The system gathers the user’s habit and tracking data.
3. The system generates a CSV file.
4. The user downloads the file.

### Postconditions
- A CSV export is generated successfully.

---

## 3. Notes

- One habit can have at most one entry per date.
- Only the owner of a habit can view or modify it.
- Archived habits are not tracked as active habits but their history remains available.