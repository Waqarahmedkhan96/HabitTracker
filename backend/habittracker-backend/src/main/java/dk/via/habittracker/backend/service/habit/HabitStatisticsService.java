package dk.via.habittracker.backend.service.habit;

import dk.via.habittracker.backend.entity.Habit;
import dk.via.habittracker.backend.entity.HabitEntry;
import dk.via.habittracker.backend.enums.HabitEntryStatus;
import dk.via.habittracker.backend.repository.HabitEntryRepository;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
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
    List<HabitEntry> completedEntries = habitEntryRepository.findByHabitOrderByEntryDateDesc(habit)
        .stream()
        .filter(entry -> entry.getStatus() == HabitEntryStatus.COMPLETED)
        .sorted(Comparator.comparing(HabitEntry::getEntryDate).reversed())
        .toList();

    int streak = 0;
    LocalDate expectedDate = LocalDate.now();

    for (HabitEntry entry : completedEntries)
    {
      if (entry.getEntryDate().equals(expectedDate))
      {
        streak++;
        expectedDate = expectedDate.minusDays(1);
      }
      else if (entry.getEntryDate().isBefore(expectedDate))
      {
        break;
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