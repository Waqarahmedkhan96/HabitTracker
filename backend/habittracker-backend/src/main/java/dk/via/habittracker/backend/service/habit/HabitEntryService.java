package dk.via.habittracker.backend.service.habit;

import dk.via.habittracker.backend.dto.habit.HabitEntryRequest;
import dk.via.habittracker.backend.dto.habit.HabitEntryResponse;
import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.Habit;
import dk.via.habittracker.backend.entity.HabitEntry;
import dk.via.habittracker.backend.repository.AppUserRepository;
import dk.via.habittracker.backend.exception.ResourceNotFoundException;
import dk.via.habittracker.backend.repository.HabitEntryRepository;
import dk.via.habittracker.backend.repository.HabitRepository;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class HabitEntryService
{
  private final HabitRepository habitRepository;
  private final HabitEntryRepository habitEntryRepository;
  private final AppUserRepository userRepository;

  public HabitEntryService(HabitRepository habitRepository,
                           HabitEntryRepository habitEntryRepository,
                           AppUserRepository userRepository)
  {
    this.habitRepository = habitRepository;
    this.habitEntryRepository = habitEntryRepository;
    this.userRepository = userRepository;
  }

  public HabitEntryResponse saveEntry(UUID habitId, HabitEntryRequest request, Principal principal)
  {
    Habit habit = getActiveUserHabit(habitId, principal);

    HabitEntry entry = habitEntryRepository.findByHabitAndEntryDate(habit, request.getEntryDate())
        .orElseGet(HabitEntry::new);

    entry.setHabit(habit);
    entry.setEntryDate(request.getEntryDate());
    entry.setStatus(request.getStatus());
    entry.setValueAchieved(request.getValueAchieved());
    entry.setNote(request.getNote());

    return mapToResponse(habitEntryRepository.save(entry));
  }

  public List<HabitEntryResponse> getEntries(UUID habitId, Principal principal)
  {
    Habit habit = getUserHabit(habitId, principal);

    return habitEntryRepository.findByHabitOrderByEntryDateDesc(habit)
        .stream()
        .map(this::mapToResponse)
        .toList();
  }

  public HabitEntryResponse updateEntry(UUID habitId, UUID entryId, HabitEntryRequest request, Principal principal)
  {
    Habit habit = getActiveUserHabit(habitId, principal);

    HabitEntry entry = habitEntryRepository.findByIdAndHabit(entryId, habit)
        .orElseThrow(() -> new ResourceNotFoundException("Entry not found"));

    entry.setStatus(request.getStatus());
    entry.setValueAchieved(request.getValueAchieved());
    entry.setNote(request.getNote());

    return mapToResponse(habitEntryRepository.save(entry));
  }

  private Habit getUserHabit(UUID habitId, Principal principal)
  {
    AppUser user = userRepository.findByUsername(principal.getName())
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    return habitRepository.findByIdAndUser(habitId, user)
        .orElseThrow(() -> new ResourceNotFoundException("Habit not found"));
  }

  private Habit getActiveUserHabit(UUID habitId, Principal principal)
  {
    Habit habit = getUserHabit(habitId, principal);

    if (Boolean.FALSE.equals(habit.getActive())) {
      throw new ResourceNotFoundException("Habit not found");
    }

    return habit;
  }

  private HabitEntryResponse mapToResponse(HabitEntry entry)
  {
    HabitEntryResponse response = new HabitEntryResponse();
    response.setId(entry.getId());
    response.setHabitId(entry.getHabit().getId());
    response.setEntryDate(entry.getEntryDate());
    response.setStatus(entry.getStatus());
    response.setValueAchieved(entry.getValueAchieved());
    response.setNote(entry.getNote());
    return response;
  }
}