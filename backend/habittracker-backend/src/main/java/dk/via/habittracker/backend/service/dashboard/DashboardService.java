package dk.via.habittracker.backend.service.dashboard;

import dk.via.habittracker.backend.dto.dashboard.DashboardResponse;
import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.Habit;
import dk.via.habittracker.backend.entity.HabitEntry;
import dk.via.habittracker.backend.enums.HabitEntryStatus;
import dk.via.habittracker.backend.exception.ResourceNotFoundException;
import dk.via.habittracker.backend.repository.AppUserRepository;
import dk.via.habittracker.backend.repository.HabitEntryRepository;
import dk.via.habittracker.backend.repository.HabitRepository;
import dk.via.habittracker.backend.util.ScheduleUtils;
import java.security.Principal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class DashboardService
{
  private final AppUserRepository userRepository;
  private final HabitRepository habitRepository;
  private final HabitEntryRepository habitEntryRepository;
  private final MasterStreakService masterStreakService;

  public DashboardService(AppUserRepository userRepository,
                          HabitRepository habitRepository,
                          HabitEntryRepository habitEntryRepository,
                          MasterStreakService masterStreakService)
  {
    this.userRepository = userRepository;
    this.habitRepository = habitRepository;
    this.habitEntryRepository = habitEntryRepository;
    this.masterStreakService = masterStreakService;
  }

  public DashboardResponse getDashboard(Principal principal)
  {
    return getDashboard(principal, null);
  }

  public DashboardResponse getDashboard(Principal principal, LocalDate referenceDate)
  {
    AppUser user = userRepository.findByUsername(principal.getName())
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    List<Habit> activeHabits = habitRepository.findByUserAndActiveTrueOrderByDisplayOrderAsc(user);

    int completedToday = 0;
    int missedToday = 0;
    List<String> titles = new ArrayList<>();
    LocalDate today = referenceDate != null ? referenceDate : LocalDate.now();

    for (Habit habit : activeHabits)
    {
      Set<DayOfWeek> selectedDays = ScheduleUtils.parseSelectedDays(habit.getSelectedDaysCsv());
      boolean scheduledToday = ScheduleUtils.isScheduledOn(today, selectedDays, habit.getFrequencyType().name().equals("DAILY"));

      if (!scheduledToday)
      {
        continue;
      }

      titles.add(habit.getTitle());

      HabitEntry entry = habitEntryRepository.findByHabitAndEntryDate(habit, today).orElse(null);

      if (entry != null)
      {
        if (entry.getStatus() == HabitEntryStatus.COMPLETED)
        {
          completedToday++;
        }
        else if (entry.getStatus() == HabitEntryStatus.MISSED)
        {
          missedToday++;
        }
      }
      else
      {
        missedToday++;
      }
    }

    DashboardResponse response = new DashboardResponse();
    response.setTotalActiveHabits(activeHabits.size());
    response.setCompletedToday(completedToday);
    response.setMissedToday(missedToday);
    response.setMasterStreak(masterStreakService.calculateMasterStreak(activeHabits, today));
    response.setHabitTitlesDueToday(titles);

    int dueToday = titles.size();
    response.setTodayCompletionPercentage(dueToday == 0 ? 0.0 : (completedToday * 100.0) / dueToday);

    return response;
  }
}