package dk.via.habittracker.backend.service.export;

import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.Habit;
import dk.via.habittracker.backend.entity.HabitEntry;
import dk.via.habittracker.backend.exception.ResourceNotFoundException;
import dk.via.habittracker.backend.repository.AppUserRepository;
import dk.via.habittracker.backend.repository.HabitEntryRepository;
import dk.via.habittracker.backend.repository.HabitRepository;
import java.security.Principal;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CsvExportService
{
  private final AppUserRepository userRepository;
  private final HabitRepository habitRepository;
  private final HabitEntryRepository habitEntryRepository;

  public CsvExportService(AppUserRepository userRepository,
                          HabitRepository habitRepository,
                          HabitEntryRepository habitEntryRepository)
  {
    this.userRepository = userRepository;
    this.habitRepository = habitRepository;
    this.habitEntryRepository = habitEntryRepository;
  }

  public String exportHabitsCsv(Principal principal)
  {
    AppUser user = userRepository.findByUsername(principal.getName())
        .orElseThrow(() -> new RuntimeException("User not found"));

    List<Habit> habits = habitRepository.findByUserOrderByCreatedAtDesc(user);

    StringBuilder builder = new StringBuilder();
    builder.append("Habit ID,Title,Description,Habit Type,Frequency,Active,Target Value,Unit\n");

    for (Habit habit : habits)
    {
      builder.append(habit.getId()).append(",")
          .append(safe(habit.getTitle())).append(",")
          .append(safe(habit.getDescription())).append(",")
          .append(habit.getHabitType()).append(",")
          .append(habit.getFrequencyType()).append(",")
          .append(habit.getActive()).append(",")
          .append(habit.getTargetValue() != null ? habit.getTargetValue() : "").append(",")
          .append(safe(habit.getUnit())).append("\n");
    }

    return builder.toString();
  }

  public String exportEntriesCsv(Principal principal)
  {
    AppUser user = userRepository.findByUsername(principal.getName())
        .orElseThrow(() -> new RuntimeException("User not found"));

    List<Habit> habits = habitRepository.findByUserOrderByCreatedAtDesc(user);

    StringBuilder builder = new StringBuilder();
    builder.append("Habit Title,Entry Date,Status,Value Achieved,Note\n");

    for (Habit habit : habits)
    {
      List<HabitEntry> entries = habitEntryRepository.findByHabitOrderByEntryDateDesc(habit);

      for (HabitEntry entry : entries)
      {
        builder.append(safe(habit.getTitle())).append(",")
            .append(entry.getEntryDate()).append(",")
            .append(entry.getStatus()).append(",")
            .append(entry.getValueAchieved() != null ? entry.getValueAchieved() : "").append(",")
            .append(safe(entry.getNote())).append("\n");
      }
    }

    return builder.toString();
  }

  private String safe(String value)
  {
    if (value == null)
    {
      return "";
    }
    return "\"" + value.replace("\"", "\"\"") + "\"";
  }
}