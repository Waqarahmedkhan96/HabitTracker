package dk.via.habittracker.backend.dto.habit;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public class ReorderHabitsRequest {
    @NotEmpty(message = "Habit IDs list cannot be empty")
    private List<UUID> habitIds;

    public List<UUID> getHabitIds() {
        return habitIds;
    }

    public void setHabitIds(List<UUID> habitIds) {
        this.habitIds = habitIds;
    }
}
