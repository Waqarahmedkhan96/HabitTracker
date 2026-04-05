package dk.via.habittracker.backend.service.dashboard;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
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
class MasterStreakServiceTest
{
  @Mock
  private HabitEntryRepository habitEntryRepository;

  private MasterStreakService masterStreakService;

  @BeforeEach
  void setUp()
  {
    masterStreakService = new MasterStreakService(habitEntryRepository);
  }

  @Test
  void calculatesMasterStreakWhenAllScheduledHabitsAreCompleted()
  {
    LocalDate today = LocalDate.now();
    Habit first = habit(true, FrequencyType.DAILY, null, today.minusDays(3));
    Habit second = habit(true, FrequencyType.DAILY, null, today.minusDays(3));

    List<HabitEntry> entries = List.of(
        entry(first, today, HabitEntryStatus.COMPLETED),
        entry(second, today, HabitEntryStatus.COMPLETED),
        entry(first, today.minusDays(1), HabitEntryStatus.COMPLETED),
        entry(second, today.minusDays(1), HabitEntryStatus.COMPLETED),
        entry(first, today.minusDays(2), HabitEntryStatus.COMPLETED),
        entry(second, today.minusDays(2), HabitEntryStatus.COMPLETED)
    );

    when(habitEntryRepository.findByHabitInAndEntryDateBetween(any(), any(), any())).thenReturn(entries);

    int streak = masterStreakService.calculateMasterStreak(List.of(first, second));

    assertEquals(3, streak);
  }

  @Test
  void missedHabitBreaksMasterStreak()
  {
    LocalDate today = LocalDate.now();
    Habit first = habit(true, FrequencyType.DAILY, null, today.minusDays(2));
    Habit second = habit(true, FrequencyType.DAILY, null, today.minusDays(2));

    List<HabitEntry> entries = List.of(
        entry(first, today, HabitEntryStatus.COMPLETED),
        entry(second, today, HabitEntryStatus.COMPLETED),
        entry(first, today.minusDays(1), HabitEntryStatus.COMPLETED),
        entry(second, today.minusDays(1), HabitEntryStatus.MISSED)
    );

    when(habitEntryRepository.findByHabitInAndEntryDateBetween(any(), any(), any())).thenReturn(entries);

    int streak = masterStreakService.calculateMasterStreak(List.of(first, second));

    assertEquals(1, streak);
  }

  @Test
  void partialHabitEntryBreaksMasterStreak()
  {
    LocalDate today = LocalDate.now();
    Habit numericHabit = habit(true, FrequencyType.DAILY, null, today.minusDays(2));

    List<HabitEntry> entries = List.of(
        entry(numericHabit, today, HabitEntryStatus.COMPLETED),
        entry(numericHabit, today.minusDays(1), HabitEntryStatus.PARTIAL)
    );

    when(habitEntryRepository.findByHabitInAndEntryDateBetween(any(), any(), any())).thenReturn(entries);

    int streak = masterStreakService.calculateMasterStreak(List.of(numericHabit));

    assertEquals(1, streak);
  }

  @Test
  void missingScheduledEntryBreaksMasterStreak()
  {
    LocalDate today = LocalDate.now();
    Habit habit = habit(true, FrequencyType.DAILY, null, today.minusDays(2));

    List<HabitEntry> entries = List.of(entry(habit, today, HabitEntryStatus.COMPLETED));

    when(habitEntryRepository.findByHabitInAndEntryDateBetween(any(), any(), any())).thenReturn(entries);

    int streak = masterStreakService.calculateMasterStreak(List.of(habit));

    assertEquals(1, streak);
  }

  @Test
  void noScheduledHabitsDayCountsAsPerfect()
  {
    LocalDate today = LocalDate.now();
    Habit selectedDaysHabit = habit(true, FrequencyType.SELECTED_DAYS, today.getDayOfWeek().name(), today.minusDays(1));

    List<HabitEntry> entries = List.of(entry(selectedDaysHabit, today, HabitEntryStatus.COMPLETED));

    when(habitEntryRepository.findByHabitInAndEntryDateBetween(any(), any(), any())).thenReturn(entries);

    int streak = masterStreakService.calculateMasterStreak(List.of(selectedDaysHabit));

    assertEquals(2, streak);
  }

  @Test
  void archivedHabitsAreIgnoredInMasterStreak()
  {
    LocalDate today = LocalDate.now();
    Habit activeHabit = habit(true, FrequencyType.DAILY, null, today.minusDays(1));
    Habit archivedHabit = habit(false, FrequencyType.DAILY, null, today.minusDays(1));

    List<HabitEntry> entries = List.of(
        entry(activeHabit, today, HabitEntryStatus.COMPLETED),
        entry(activeHabit, today.minusDays(1), HabitEntryStatus.COMPLETED),
        entry(archivedHabit, today, HabitEntryStatus.MISSED)
    );

    when(habitEntryRepository.findByHabitInAndEntryDateBetween(any(), any(), any())).thenReturn(entries);

    int streak = masterStreakService.calculateMasterStreak(List.of(activeHabit, archivedHabit));

    assertEquals(2, streak);
  }

  @Test
  void habitDoesNotAffectDaysBeforeItWasCreated()
  {
    LocalDate today = LocalDate.now();
    Habit longRunningHabit = habit(true, FrequencyType.DAILY, null, today.minusDays(4));
    Habit recentlyCreatedHabit = habit(true, FrequencyType.DAILY, null, today.minusDays(1));

    List<HabitEntry> entries = List.of(
        entry(longRunningHabit, today, HabitEntryStatus.COMPLETED),
        entry(longRunningHabit, today.minusDays(1), HabitEntryStatus.COMPLETED),
        entry(longRunningHabit, today.minusDays(2), HabitEntryStatus.COMPLETED),
        entry(longRunningHabit, today.minusDays(3), HabitEntryStatus.COMPLETED),
        entry(longRunningHabit, today.minusDays(4), HabitEntryStatus.COMPLETED),
        entry(recentlyCreatedHabit, today, HabitEntryStatus.COMPLETED),
        entry(recentlyCreatedHabit, today.minusDays(1), HabitEntryStatus.COMPLETED)
    );

    when(habitEntryRepository.findByHabitInAndEntryDateBetween(any(), any(), any())).thenReturn(entries);

    int streak = masterStreakService.calculateMasterStreak(List.of(longRunningHabit, recentlyCreatedHabit));

    assertEquals(5, streak);
  }

  private Habit habit(boolean active, FrequencyType frequencyType, String selectedDaysCsv, LocalDate createdDate)
  {
    Habit habit = new Habit();
    habit.setId(UUID.randomUUID());
    habit.setActive(active);
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