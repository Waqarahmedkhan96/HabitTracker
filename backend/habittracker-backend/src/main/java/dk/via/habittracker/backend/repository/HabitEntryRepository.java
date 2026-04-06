package dk.via.habittracker.backend.repository;

import dk.via.habittracker.backend.entity.Habit;
import dk.via.habittracker.backend.entity.HabitEntry;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HabitEntryRepository extends JpaRepository<HabitEntry, UUID>
{
  Optional<HabitEntry> findByIdAndHabit(UUID id, Habit habit);
  Optional<HabitEntry> findByHabitAndEntryDate(Habit habit, LocalDate entryDate);
  List<HabitEntry> findByHabitOrderByEntryDateDesc(Habit habit);
  List<HabitEntry> findByHabitAndEntryDateBetweenOrderByEntryDateAsc(Habit habit, LocalDate start, LocalDate end);
  List<HabitEntry> findByHabitIn(List<Habit> habits);
  List<HabitEntry> findByHabitInAndEntryDateBetween(List<Habit> habits, LocalDate start, LocalDate end);
}