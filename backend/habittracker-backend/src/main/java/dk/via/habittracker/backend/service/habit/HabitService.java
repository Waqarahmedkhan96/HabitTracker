package dk.via.habittracker.backend.service.habit;

import dk.via.habittracker.backend.dto.habit.HabitRequest;
import dk.via.habittracker.backend.dto.habit.HabitResponse;
import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.Category;
import dk.via.habittracker.backend.entity.Habit;
import dk.via.habittracker.backend.exception.BadRequestException;
import dk.via.habittracker.backend.exception.ResourceNotFoundException;
import dk.via.habittracker.backend.repository.AppUserRepository;
import dk.via.habittracker.backend.repository.CategoryRepository;
import dk.via.habittracker.backend.repository.HabitRepository;
import dk.via.habittracker.backend.util.ScheduleUtils;
import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class HabitService
{
  private final HabitRepository habitRepository;
  private final AppUserRepository userRepository;
  private final CategoryRepository categoryRepository;
  private final HabitStatisticsService habitStatisticsService;

  public HabitService(HabitRepository habitRepository,
                      AppUserRepository userRepository,
                      CategoryRepository categoryRepository,
                      HabitStatisticsService habitStatisticsService)
  {
    this.habitRepository = habitRepository;
    this.userRepository = userRepository;
    this.categoryRepository = categoryRepository;
    this.habitStatisticsService = habitStatisticsService;
  }

  public List<HabitResponse> getAllHabits(Principal principal)
  {
    AppUser user = getCurrentUser(principal);
    return habitRepository.findByUserOrderByCreatedAtDesc(user)
        .stream()
        .map(this::mapToResponse)
        .toList();
  }

  public HabitResponse getHabitById(UUID habitId, Principal principal)
  {
    AppUser user = getCurrentUser(principal);
    Habit habit = habitRepository.findByIdAndUser(habitId, user)
        .orElseThrow(() -> new ResourceNotFoundException("Habit not found"));
    return mapToResponse(habit);
  }

  public HabitResponse createHabit(HabitRequest request, Principal principal)
  {
    AppUser user = getCurrentUser(principal);

    Habit habit = new Habit();
    habit.setUser(user);
    applyRequestToHabit(request, user, habit);

    return mapToResponse(habitRepository.save(habit));
  }

  public HabitResponse updateHabit(UUID habitId, HabitRequest request, Principal principal)
  {
    AppUser user = getCurrentUser(principal);

    Habit habit = habitRepository.findByIdAndUser(habitId, user)
        .orElseThrow(() -> new ResourceNotFoundException("Habit not found"));

    applyRequestToHabit(request, user, habit);

    return mapToResponse(habitRepository.save(habit));
  }

  public void deleteHabit(UUID habitId, Principal principal)
  {
    AppUser user = getCurrentUser(principal);
    Habit habit = habitRepository.findByIdAndUser(habitId, user)
        .orElseThrow(() -> new ResourceNotFoundException("Habit not found"));

    habit.setActive(false);
    habitRepository.save(habit);
  }

  private void applyRequestToHabit(HabitRequest request, AppUser user, Habit habit)
  {
    if (request.getTitle() == null || request.getTitle().isBlank()) {
      throw new BadRequestException("Habit title is required");
    }

    if (request.getHabitType() == null) {
      throw new BadRequestException("Habit type is required");
    }

    if (request.getFrequencyType() == null) {
      throw new BadRequestException("Frequency type is required");
    }

    Set<String> selectedDays = Collections.emptySet();
    if (request.getFrequencyType().name().equals("SELECTED_DAYS")) {
      selectedDays = ScheduleUtils.parseSelectedDays(request.getSelectedDaysCsv()).stream().map(Enum::name).collect(Collectors.toSet());
      if (selectedDays.isEmpty()) {
        throw new BadRequestException("Selected days are required for SELECTED_DAYS frequency");
      }
      habit.setSelectedDaysCsv(ScheduleUtils.normalizeCsv(request.getSelectedDaysCsv()));
    } else {
      habit.setSelectedDaysCsv(null);
    }

    if (request.getHabitType().name().equals("NUMERIC")) {
      if (request.getTargetValue() == null) {
        throw new BadRequestException("Numeric target value is required for NUMERIC habits");
      }
      if (request.getTargetValue().signum() <= 0) {
        throw new BadRequestException("Numeric target value must be greater than zero");
      }
    }

    habit.setTitle(request.getTitle().trim());
    habit.setDescription(request.getDescription());
    habit.setHabitType(request.getHabitType());
    habit.setFrequencyType(request.getFrequencyType());
    habit.setTargetValue(request.getTargetValue());
    habit.setUnit(request.getUnit());
    habit.setActive(request.getActive() != null ? request.getActive() : habit.getActive() != null ? habit.getActive() : true);
    habit.setReminderEnabled(request.getReminderEnabled() != null ? request.getReminderEnabled() : habit.getReminderEnabled() != null ? habit.getReminderEnabled() : false);

    if (request.getCategoryId() != null)
    {
      Category category = categoryRepository.findByIdAndUser(request.getCategoryId(), user)
          .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
      habit.setCategory(category);
    }
    else
    {
      habit.setCategory(null);
    }
  }

  private HabitResponse mapToResponse(Habit habit)
  {
    HabitResponse response = new HabitResponse();
    response.setId(habit.getId());
    response.setTitle(habit.getTitle());
    response.setDescription(habit.getDescription());
    response.setHabitType(habit.getHabitType());
    response.setFrequencyType(habit.getFrequencyType());
    response.setActive(habit.getActive());
    response.setReminderEnabled(habit.getReminderEnabled());
    response.setTargetValue(habit.getTargetValue());
    response.setUnit(habit.getUnit());
    response.setSelectedDaysCsv(habit.getSelectedDaysCsv());
    response.setCreatedAt(habit.getCreatedAt());

    if (habit.getCategory() != null)
    {
      response.setCategoryId(habit.getCategory().getId());
      response.setCategoryName(habit.getCategory().getName());
    }

    response.setCurrentStreak(habitStatisticsService.calculateCurrentStreak(habit));
    response.setLongestStreak(habitStatisticsService.calculateLongestStreak(habit));
    response.setSuccessPercentage(habitStatisticsService.calculateSuccessPercentage(habit));

    return response;
  }

  private AppUser getCurrentUser(Principal principal)
  {
    return userRepository.findByUsername(principal.getName())
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }
}