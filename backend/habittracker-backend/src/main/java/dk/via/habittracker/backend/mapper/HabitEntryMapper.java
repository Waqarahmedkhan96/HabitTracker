package dk.via.habittracker.backend.mapper;

import dk.via.habittracker.backend.dto.habit.HabitEntryResponse;
import dk.via.habittracker.backend.entity.HabitEntry;

public final class HabitEntryMapper {
    private HabitEntryMapper() {
    }

    public static HabitEntryResponse toResponse(HabitEntry entry) {
        HabitEntryResponse response = new HabitEntryResponse();
        response.setId(entry.getId());
        response.setHabitId(entry.getHabit().getId());
        response.setEntryDate(entry.getEntryDate());
        response.setStatus(entry.getStatus());
        response.setValueAchieved(entry.getValueAchieved());
        response.setNote(entry.getNote());
        return response;
    }
}
