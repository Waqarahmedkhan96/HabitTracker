package dk.via.habittracker.backend.service.habit;

import dk.via.habittracker.backend.entity.Habit;
import dk.via.habittracker.backend.entity.HabitEntry;
import dk.via.habittracker.backend.enums.HabitEntryStatus;
import dk.via.habittracker.backend.repository.HabitEntryRepository;
import dk.via.habittracker.backend.util.ScheduleUtils;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class HabitStatisticsService
{
  private final HabitEntryRepository habitEntryRepository;

  public HabitStatisticsService(HabitEntryRepository habitEntryRepository)
  {
    this.habitEntryRepository = habitEntryRepository;
  }

  public int calculateCurrentStreak(Habit habit)
  {
    LocalDate today = LocalDate.now();
    LocalDate createdDate = habit.getCreatedAt() != null
        ? habit.getCreatedAt().toLocalDate()
        : LocalDate.ofEpochDay(0);

    boolean daily = habit.getFrequencyType().name().equals("DAILY");
    Set<DayOfWeek> selectedDays = ScheduleUtils.parseSelectedDays(habit.getSelectedDaysCsv());

    Map<LocalDate, HabitEntryStatus> statusByDate = habitEntryRepository.findByHabitOrderByEntryDateDesc(habit)
        .stream()
        .collect(Collectors.toMap(HabitEntry::getEntryDate, HabitEntry::getStatus, (first, second) -> second));

    LocalDate earliestEntryDate = statusByDate.keySet().stream()
        .min(LocalDate::compareTo)
        .orElse(today);
    LocalDate streakStartBoundary = createdDate.isBefore(earliestEntryDate) ? createdDate : earliestEntryDate;

    if (today.isBefore(streakStartBoundary))
    {
      return 0;
    }

    int streak = 0;

    for (LocalDate date = today; !date.isBefore(streakStartBoundary); date = date.minusDays(1))
    {
      if (!ScheduleUtils.isScheduledOn(date, selectedDays, daily))
      {
        continue;
      }

      HabitEntryStatus status = statusByDate.get(date);

      if (status == HabitEntryStatus.MISSED)
      {
        break;
      }

      if (status == HabitEntryStatus.COMPLETED)
      {
        streak++;
      }
    }

    return streak;
  }

  public int calculateLongestStreak(Habit habit)
  {
    List<LocalDate> completedDates = habitEntryRepository.findByHabitOrderByEntryDateDesc(habit)
        .stream()
        .filter(entry -> entry.getStatus() == HabitEntryStatus.COMPLETED)
        .map(HabitEntry::getEntryDate)
        .sorted()
        .toList();

    int longest = 0;
    int current = 0;
    LocalDate previous = null;

    for (LocalDate date : completedDates)
    {
      if (previous == null || date.equals(previous.plusDays(1)))
      {
        current++;
      }
      else
      {
        current = 1;
      }

      longest = Math.max(longest, current);
      previous = date;
    }

    return longest;
  }

  public double calculateSuccessPercentage(Habit habit)
  {
    List<HabitEntry> entries = habitEntryRepository.findByHabitOrderByEntryDateDesc(habit);

    if (entries.isEmpty())
    {
      return 0.0;
    }

    long completed = entries.stream()
        .filter(entry -> entry.getStatus() == HabitEntryStatus.COMPLETED)
        .count();

    return (completed * 100.0) / entries.size();
  }
}