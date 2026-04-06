package dk.via.habittracker.backend.service.habit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import dk.via.habittracker.backend.entity.Habit;
import dk.via.habittracker.backend.entity.HabitEntry;
import dk.via.habittracker.backend.enums.FrequencyType;
import dk.via.habittracker.backend.enums.HabitEntryStatus;
import dk.via.habittracker.backend.repository.HabitEntryRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class HabitStatisticsServiceTest
{
  @Mock
  private HabitEntryRepository habitEntryRepository;

  private HabitStatisticsService habitStatisticsService;

  @BeforeEach
  void setUp()
  {
    habitStatisticsService = new HabitStatisticsService(habitEntryRepository);
  }

  @Test
  void currentDayNoEntryKeepsCurrentStreak()
  {
    LocalDate today = LocalDate.now();
    Habit habit = habit(FrequencyType.DAILY, null, today.minusDays(10));

    List<HabitEntry> entries = List.of(
        entry(habit, today.minusDays(1), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(2), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(3), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(4), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(5), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(6), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(7), HabitEntryStatus.COMPLETED)
    );

    when(habitEntryRepository.findByHabitOrderByEntryDateDesc(habit)).thenReturn(entries);

    assertEquals(7, habitStatisticsService.calculateCurrentStreak(habit));
  }

  @Test
  void createdTodayWithBackfilledEntriesKeepsCurrentStreak()
  {
    LocalDate today = LocalDate.now();
    Habit habit = habit(FrequencyType.DAILY, null, today);

    List<HabitEntry> entries = List.of(
        entry(habit, today.minusDays(1), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(2), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(3), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(4), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(5), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(6), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(7), HabitEntryStatus.COMPLETED)
    );

    when(habitEntryRepository.findByHabitOrderByEntryDateDesc(habit)).thenReturn(entries);

    assertEquals(7, habitStatisticsService.calculateCurrentStreak(habit));
  }

  @Test
  void completedTodayExtendsCurrentStreak()
  {
    LocalDate today = LocalDate.now();
    Habit habit = habit(FrequencyType.DAILY, null, today.minusDays(10));

    List<HabitEntry> entries = List.of(
        entry(habit, today, HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(1), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(2), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(3), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(4), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(5), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(6), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(7), HabitEntryStatus.COMPLETED)
    );

    when(habitEntryRepository.findByHabitOrderByEntryDateDesc(habit)).thenReturn(entries);

    assertEquals(8, habitStatisticsService.calculateCurrentStreak(habit));
  }

  @Test
  void missedTodayResetsCurrentStreak()
  {
    LocalDate today = LocalDate.now();
    Habit habit = habit(FrequencyType.DAILY, null, today.minusDays(10));

    List<HabitEntry> entries = List.of(
        entry(habit, today, HabitEntryStatus.MISSED),
        entry(habit, today.minusDays(1), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(2), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(3), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(4), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(5), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(6), HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(7), HabitEntryStatus.COMPLETED)
    );

    when(habitEntryRepository.findByHabitOrderByEntryDateDesc(habit)).thenReturn(entries);

    assertEquals(0, habitStatisticsService.calculateCurrentStreak(habit));
  }

  @Test
  void unscheduledDaysDoNotBreakCurrentStreak()
  {
    LocalDate today = LocalDate.now();
    String selectedDays = today.getDayOfWeek().name() + "," + today.minusDays(2).getDayOfWeek().name();
    Habit habit = habit(FrequencyType.SELECTED_DAYS, selectedDays, today.minusDays(10));

    List<HabitEntry> entries = List.of(
        entry(habit, today, HabitEntryStatus.COMPLETED),
        entry(habit, today.minusDays(2), HabitEntryStatus.COMPLETED)
    );

    when(habitEntryRepository.findByHabitOrderByEntryDateDesc(habit)).thenReturn(entries);

    assertEquals(2, habitStatisticsService.calculateCurrentStreak(habit));
  }

  private Habit habit(FrequencyType frequencyType, String selectedDaysCsv, LocalDate createdDate)
  {
    Habit habit = new Habit();
    habit.setId(UUID.randomUUID());
    habit.setActive(true);
    habit.setFrequencyType(frequencyType);
    habit.setSelectedDaysCsv(selectedDaysCsv);
    ReflectionTestUtils.setField(habit, "createdAt", LocalDateTime.of(createdDate, LocalTime.MIN));
    return habit;
  }

  private HabitEntry entry(Habit habit, LocalDate date, HabitEntryStatus status)
  {
    HabitEntry entry = new HabitEntry();
    entry.setHabit(habit);
    entry.setEntryDate(date);
    entry.setStatus(status);
    return entry;
  }
}
