package dk.via.habittracker.backend.mapper;

import dk.via.habittracker.backend.dto.reminder.ReminderResponse;
import dk.via.habittracker.backend.entity.Reminder;

public final class ReminderMapper {
    private ReminderMapper() {
    }

    public static ReminderResponse toResponse(Reminder reminder) {
        ReminderResponse response = new ReminderResponse();
        response.setId(reminder.getId());
        response.setHabitId(reminder.getHabit().getId());
        response.setReminderTime(reminder.getReminderTime());
        response.setEnabled(reminder.getEnabled());
        response.setDaysCsv(reminder.getDaysCsv());
        return response;
    }
}
