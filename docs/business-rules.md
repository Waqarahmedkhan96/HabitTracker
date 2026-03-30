# Habit Tracker - Business Rules

## 1. User Rules

### BR1. User ownership
Each habit, category, reminder, and preference record must belong to exactly one user.

### BR2. Data isolation
A user may only access and modify their own data.

### BR3. Authentication required
Only authenticated users may access protected features such as habits, entries, dashboard, export, and preferences.

---

## 2. Habit Rules

### BR4. Habit ownership
Each habit must belong to exactly one user.

### BR5. Habit activity
A habit is considered active when `active = true`.

### BR6. Archive instead of delete
Habits should be archived by setting `active = false` instead of being permanently deleted in normal use.

### BR7. Habit types
The system supports two habit types:
- `BOOLEAN`
- `NUMERIC`

### BR8. COMPLETED habit rules
For `BOOLEAN` habits:
- the habit is tracked as done or not done
- no numeric achieved value is required
- target value and unit may be null

### BR9. NUMERIC habit rules
For `NUMERIC` habits:
- the habit is tracked using a numeric achieved value
- `targetValue` is required
- `unit` may be used to describe the target, for example liters, minutes, or steps

### BR10. Frequency types
The system supports two frequency types:
- `DAILY`
- `SELECTED_DAYS`

### BR11. DAILY schedule
For `DAILY` habits, the habit is expected every day.

### BR12. SELECTED_DAYS schedule
For `SELECTED_DAYS` habits, at least one day must be selected.

### BR13. Selected days storage
Selected days may be stored as a CSV string, but the system must validate that only valid weekday values are saved.

---

## 3. Habit Entry Rules

### BR14. One entry per day
A habit may have at most one entry per date.

### BR15. Entry uniqueness
The combination of `(habit_id, entryDate)` must be unique.

### BR16. Entry ownership
A habit entry belongs to exactly one habit and indirectly to exactly one user.

### BR17. Entry for active habits
Only active habits should be tracked in normal use.

### BR18. BOOLEAN entry rules
For `BOOLEAN` habits:
- the entry status may be `COMPLETED` or `MISSED`
- numeric achieved value must be null
- partial status is not allowed

### BR19. NUMERIC entry rules
For `NUMERIC` habits:
- numeric achieved value may be provided
- status may be `COMPLETED`, `MISSED`, or `PARTIAL`

### BR20. Numeric status evaluation
For `NUMERIC` habits, the status should be determined using the target value:
- `COMPLETED` if achieved value is greater than or equal to target value
- `PARTIAL` if achieved value is greater than zero and lower than target value
- `MISSED` if achieved value is zero or no progress is recorded

### BR21. Entry update
If an entry already exists for the same habit and date, the system should update it instead of creating a duplicate.

---

## 4. Streak Rules

### BR22. Scheduled days only
Streak calculations must consider only scheduled days.

### BR23. DAILY streak logic
For `DAILY` habits, every calendar day is considered a scheduled day.

### BR24. SELECTED_DAYS streak logic
For `SELECTED_DAYS` habits, only the selected weekdays are considered scheduled days.

### BR25. Streak continuation
A streak continues when the habit is successfully completed on each consecutive scheduled day.

### BR26. Streak break
A streak is broken when a scheduled day is missed.

### BR27. Unscheduled days
Unscheduled days must not break a streak.

### BR28. Longest streak
The system must maintain or calculate the longest historical streak for each habit.

---

## 5. Category Rules

### BR29. Category ownership
Each category belongs to exactly one user.

### BR30. Category uniqueness per user
Category names must be unique per user.

### BR31. Optional category assignment
A habit may belong to zero or one category.

### BR32. Category reuse
One category may be assigned to multiple habits of the same user.

---

## 6. Reminder Rules

### BR33. Reminder ownership
Each reminder belongs to exactly one habit.

### BR34. Reminder configuration
A reminder may include:
- reminder time
- enabled flag
- selected days

### BR35. Reminder activation
A reminder is active only when `enabled = true`.

### BR36. Reminder scope
Reminders are configuration records unless a notification delivery mechanism is implemented.

---

## 7. User Preference Rules

### BR37. Single preference record
A user may have zero or one preference record.

### BR38. Theme mode
Theme mode must be one of the supported enum values.

### BR39. Notification preferences
Notification preferences must be stored at user preference level and applied consistently by the system.

---

## 8. Dashboard and Statistics Rules

### BR40. Dashboard scope
The dashboard should show habits scheduled for the current day.

### BR41. Dashboard progress
Dashboard progress should be calculated using the statuses of today’s scheduled habits.

### BR42. Statistics visibility
A user may only view statistics for habits they own.

### BR43. Historical consistency
Archived habits must still keep their historical entries and statistics available.

---

## 9. Export Rules

### BR44. Export ownership
A user may only export their own data.

### BR45. Export content
CSV export should include habit-related tracking data in a structured format.

### BR46. Export reliability
The export process must not modify stored habit data.

---

## 10. Validation Rules

### BR47. Required title
A habit title is required.

### BR48. Required type
A habit type is required.

### BR49. Required frequency
A frequency type is required.

### BR50. Numeric target validation
For `NUMERIC` habits, `targetValue` must be greater than zero.

### BR51. Selected days validation
For `SELECTED_DAYS`, at least one valid weekday must be provided.

### BR52. Entry date validation
An entry must always contain a valid date.

### BR53. Consistent status validation
The system must reject invalid combinations of habit type, entry status, and numeric value.
