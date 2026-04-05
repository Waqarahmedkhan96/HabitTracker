package dk.via.habittracker.backend.service.dashboard;

import dk.via.habittracker.backend.entity.Habit;
import dk.via.habittracker.backend.entity.HabitEntry;
import dk.via.habittracker.backend.enums.HabitEntryStatus;
import dk.via.habittracker.backend.repository.HabitEntryRepository;
import dk.via.habittracker.backend.util.ScheduleUtils;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class MasterStreakService
{
  private final HabitEntryRepository habitEntryRepository;

  public MasterStreakService(HabitEntryRepository habitEntryRepository)
  {
    this.habitEntryRepository = habitEntryRepository;
  }

  public int calculateMasterStreak(List<Habit> habits)
  {
    return calculateMasterStreak(habits, null);
  }

  public int calculateMasterStreak(List<Habit> habits, LocalDate referenceDate)
  {
    List<Habit> activeHabits = habits.stream()
        .filter(habit -> Boolean.TRUE.equals(habit.getActive()))
        .toList();

    if (activeHabits.isEmpty())
    {
      return 0;
    }

    LocalDate today = referenceDate != null ? referenceDate : LocalDate.now();
    LocalDate streakStartBoundary = resolveStreakStartBoundary(activeHabits, today);

    List<HabitEntry> entries = habitEntryRepository.findByHabitInAndEntryDateBetween(activeHabits, streakStartBoundary, today);

    Map<UUID, Map<LocalDate, HabitEntryStatus>> entryStatusByHabitAndDay = toEntryStatusMap(entries);
    Map<UUID, Set<DayOfWeek>> selectedDaysByHabit = new HashMap<>();
    Map<UUID, LocalDate> createdDateByHabit = new HashMap<>();

    for (Habit habit : activeHabits)
    {
      selectedDaysByHabit.put(habit.getId(), ScheduleUtils.parseSelectedDays(habit.getSelectedDaysCsv()));
      LocalDate createdDate = habit.getCreatedAt() != null
          ? habit.getCreatedAt().toLocalDate()
          : LocalDate.ofEpochDay(0);
      createdDateByHabit.put(habit.getId(), createdDate);
    }

    int streak = 0;

    for (LocalDate date = today; !date.isBefore(streakStartBoundary); date = date.minusDays(1))
    {
      boolean allScheduledCompleted = true;
      int scheduledHabits = 0;

      for (Habit habit : activeHabits)
      {
        if (date.isBefore(createdDateByHabit.get(habit.getId())))
        {
          // Habits should not affect streak before they exist.
          continue;
        }

        boolean daily = habit.getFrequencyType().name().equals("DAILY");
        boolean scheduled = ScheduleUtils.isScheduledOn(date, selectedDaysByHabit.get(habit.getId()), daily);

        if (!scheduled)
        {
          continue;
        }

        scheduledHabits++;
        HabitEntryStatus status = entryStatusByHabitAndDay
            .getOrDefault(habit.getId(), Map.of())
            .get(date);

        if (status != HabitEntryStatus.COMPLETED)
        {
          allScheduledCompleted = false;
          break;
        }
      }

      if (scheduledHabits == 0 || allScheduledCompleted)
      {
        streak++;
        continue;
      }

      break;
    }

    return streak;
  }

  private LocalDate resolveStreakStartBoundary(List<Habit> habits, LocalDate today)
  {
    // Cap backward scanning to the earliest active habit creation date.
    return habits.stream()
        .map(Habit::getCreatedAt)
        .filter(createdAt -> createdAt != null)
        .map(LocalDateTime::toLocalDate)
        .min(LocalDate::compareTo)
        .orElse(today);
  }

  private Map<UUID, Map<LocalDate, HabitEntryStatus>> toEntryStatusMap(List<HabitEntry> entries)
  {
    Map<UUID, Map<LocalDate, HabitEntryStatus>> result = new HashMap<>();

    for (HabitEntry entry : entries)
    {
      UUID habitId = entry.getHabit().getId();
      result.computeIfAbsent(habitId, ignored -> new HashMap<>())
          .put(entry.getEntryDate(), entry.getStatus());
    }

    return result;
  }
}