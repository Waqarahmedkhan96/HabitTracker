package dk.via.habittracker.backend.dto.reminder;

import java.time.LocalTime;
import java.util.UUID;

public class ReminderResponse {
    private UUID id;
    private UUID habitId;
    private LocalTime reminderTime;
    private Boolean enabled;
    private String daysCsv;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getHabitId() {
        return habitId;
    }

    public void setHabitId(UUID habitId) {
        this.habitId = habitId;
    }

    public LocalTime getReminderTime() {
        return reminderTime;
    }

    public void setReminderTime(LocalTime reminderTime) {
        this.reminderTime = reminderTime;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public String getDaysCsv() {
        return daysCsv;
    }

    public void setDaysCsv(String daysCsv) {
        this.daysCsv = daysCsv;
    }
}
