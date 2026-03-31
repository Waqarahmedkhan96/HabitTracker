package dk.via.habittracker.backend.dto.reminder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;
import java.util.UUID;

public class ReminderRequest {
    @NotNull
    private UUID habitId;

    @NotNull
    private LocalTime reminderTime;

    @NotNull
    private Boolean enabled;

    @NotBlank
    private String daysCsv;

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
