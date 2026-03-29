package dk.via.habittracker.backend.repository;

import dk.via.habittracker.backend.entity.Habit;
import dk.via.habittracker.backend.entity.Reminder;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReminderRepository extends JpaRepository<Reminder, UUID>
{
  List<Reminder> findByHabit(Habit habit);
}