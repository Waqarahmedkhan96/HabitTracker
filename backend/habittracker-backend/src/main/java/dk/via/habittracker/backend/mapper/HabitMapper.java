package dk.via.habittracker.backend.mapper;

import dk.via.habittracker.backend.dto.habit.HabitResponse;
import dk.via.habittracker.backend.entity.Category;
import dk.via.habittracker.backend.entity.Habit;

public final class HabitMapper {
    private HabitMapper() {
    }

    public static HabitResponse toResponse(Habit habit, int currentStreak, int longestStreak, double successPercentage) {
        HabitResponse response = new HabitResponse();
        response.setId(habit.getId());
        response.setTitle(habit.getTitle());
        response.setDescription(habit.getDescription());
        response.setHabitType(habit.getHabitType());
        response.setFrequencyType(habit.getFrequencyType());
        response.setActive(habit.getActive());
        response.setReminderEnabled(habit.getReminderEnabled());
        response.setTargetValue(habit.getTargetValue());
        response.setUnit(habit.getUnit());
        response.setSelectedDaysCsv(habit.getSelectedDaysCsv());
        response.setCreatedAt(habit.getCreatedAt());
        response.setCurrentStreak(currentStreak);
        response.setLongestStreak(longestStreak);
        response.setSuccessPercentage(successPercentage);

        Category category = habit.getCategory();
        if (category != null) {
            response.setCategoryId(category.getId());
            response.setCategoryName(category.getName());
        }
        return response;
    }
}
