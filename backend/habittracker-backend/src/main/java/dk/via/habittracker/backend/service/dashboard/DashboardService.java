package dk.via.habittracker.backend.service.dashboard;

import dk.via.habittracker.backend.dto.dashboard.DashboardResponse;
import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.Habit;
import dk.via.habittracker.backend.entity.HabitEntry;
import dk.via.habittracker.backend.enums.HabitEntryStatus;
import dk.via.habittracker.backend.repository.AppUserRepository;
import dk.via.habittracker.backend.repository.HabitEntryRepository;
import dk.via.habittracker.backend.repository.HabitRepository;
import java.security.Principal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DashboardService
{
  private final AppUserRepository userRepository;
  private final HabitRepository habitRepository;
  private final HabitEntryRepository habitEntryRepository;

  public DashboardService(AppUserRepository userRepository,
                          HabitRepository habitRepository,
                          HabitEntryRepository habitEntryRepository)
  {
    this.userRepository = userRepository;
    this.habitRepository = habitRepository;
    this.habitEntryRepository = habitEntryRepository;
  }

  public DashboardResponse getDashboard(Principal principal)
  {
    AppUser user = userRepository.findByEmail(principal.getName())
        .orElseThrow(() -> new RuntimeException("User not found"));

    List<Habit> activeHabits = habitRepository.findByUserAndActiveTrueOrderByCreatedAtDesc(user);

    int completedToday = 0;
    int missedToday = 0;
    List<String> titles = new ArrayList<>();

    for (Habit habit : activeHabits)
    {
      titles.add(habit.getTitle());

      HabitEntry entry = habitEntryRepository.findByHabitAndEntryDate(habit, LocalDate.now()).orElse(null);

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
    }

    DashboardResponse response = new DashboardResponse();
    response.setTotalActiveHabits(activeHabits.size());
    response.setCompletedToday(completedToday);
    response.setMissedToday(missedToday);
    response.setHabitTitlesDueToday(titles);

    if (activeHabits.isEmpty())
    {
      response.setTodayCompletionPercentage(0.0);
    }
    else
    {
      response.setTodayCompletionPercentage((completedToday * 100.0) / activeHabits.size());
    }

    return response;
  }
}