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
import java.util.stream.Collectors;
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
    List<HabitEntry> allEntries = habitEntryRepository.findByHabitIn(activeHabits);
    LocalDate streakStartBoundary = resolveStreakStartBoundary(activeHabits, allEntries, today);

    List<HabitEntry> entries = allEntries.stream()
        .filter(entry -> !entry.getEntryDate().isBefore(streakStartBoundary) && !entry.getEntryDate().isAfter(today))
        .toList();

    Map<UUID, Map<LocalDate, HabitEntryStatus>> entryStatusByHabitAndDay = toEntryStatusMap(entries);
    Map<UUID, LocalDate> earliestEntryDateByHabit = resolveEarliestEntryDateByHabit(allEntries);
    Map<UUID, Set<DayOfWeek>> selectedDaysByHabit = new HashMap<>();
    Map<UUID, LocalDate> createdDateByHabit = new HashMap<>();

    for (Habit habit : activeHabits)
    {
      selectedDaysByHabit.put(habit.getId(), ScheduleUtils.parseSelectedDays(habit.getSelectedDaysCsv()));
      LocalDate createdDate = habit.getCreatedAt() != null
          ? habit.getCreatedAt().toLocalDate()
          : LocalDate.ofEpochDay(0);
        LocalDate earliestEntryDate = earliestEntryDateByHabit.get(habit.getId());
        LocalDate effectiveStartDate = earliestEntryDate != null && earliestEntryDate.isBefore(createdDate)
          ? earliestEntryDate
          : createdDate;
        createdDateByHabit.put(habit.getId(), effectiveStartDate);
    }

    int streak = 0;

    for (LocalDate date = today; !date.isBefore(streakStartBoundary); date = date.minusDays(1))
    {
      boolean allScheduledCompleted = true;
      int scheduledHabits = 0;
      boolean hasMissed = false;

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

        if (status == HabitEntryStatus.MISSED)
        {
          hasMissed = true;
          break;
        }

        if (status != HabitEntryStatus.COMPLETED)
        {
          allScheduledCompleted = false;
        }
      }

      if (hasMissed)
      {
        break;
      }

      if (scheduledHabits > 0 && allScheduledCompleted)
      {
        streak++;
      }
    }

    return streak;
  }

  private LocalDate resolveStreakStartBoundary(List<Habit> habits, List<HabitEntry> entries, LocalDate today)
  {
    LocalDate earliestCreatedDate = habits.stream()
        .map(Habit::getCreatedAt)
        .filter(createdAt -> createdAt != null)
        .map(LocalDateTime::toLocalDate)
        .min(LocalDate::compareTo)
        .orElse(today);

    LocalDate earliestEntryDate = entries.stream()
        .map(HabitEntry::getEntryDate)
        .min(LocalDate::compareTo)
        .orElse(today);

    return earliestCreatedDate.isBefore(earliestEntryDate) ? earliestCreatedDate : earliestEntryDate;
  }

  private Map<UUID, LocalDate> resolveEarliestEntryDateByHabit(List<HabitEntry> entries)
  {
    return entries.stream()
        .collect(Collectors.groupingBy(
            entry -> entry.getHabit().getId(),
            Collectors.mapping(
                HabitEntry::getEntryDate,
                Collectors.collectingAndThen(
                    Collectors.minBy(LocalDate::compareTo),
                    optionalDate -> optionalDate.orElse(null)
                )
            )
        ));
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