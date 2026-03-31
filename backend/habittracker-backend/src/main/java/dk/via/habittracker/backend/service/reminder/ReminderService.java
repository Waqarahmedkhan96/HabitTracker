package dk.via.habittracker.backend.service.reminder;

import dk.via.habittracker.backend.dto.reminder.ReminderRequest;
import dk.via.habittracker.backend.dto.reminder.ReminderResponse;
import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.Habit;
import dk.via.habittracker.backend.entity.Reminder;
import dk.via.habittracker.backend.exception.BadRequestException;
import dk.via.habittracker.backend.exception.ResourceNotFoundException;
import dk.via.habittracker.backend.mapper.ReminderMapper;
import dk.via.habittracker.backend.repository.AppUserRepository;
import dk.via.habittracker.backend.repository.HabitRepository;
import dk.via.habittracker.backend.repository.ReminderRepository;
import dk.via.habittracker.backend.util.ScheduleUtils;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ReminderService {
    private final ReminderRepository reminderRepository;
    private final HabitRepository habitRepository;
    private final AppUserRepository userRepository;

    public ReminderService(ReminderRepository reminderRepository,
                           HabitRepository habitRepository,
                           AppUserRepository userRepository) {
        this.reminderRepository = reminderRepository;
        this.habitRepository = habitRepository;
        this.userRepository = userRepository;
    }

    public List<ReminderResponse> getReminders(UUID habitId, Principal principal) {
        Habit habit = getOwnedHabit(habitId, principal);
        return reminderRepository.findByHabit(habit).stream()
            .map(ReminderMapper::toResponse)
            .toList();
    }

    public ReminderResponse createReminder(ReminderRequest request, Principal principal) {
        Habit habit = getOwnedHabit(request.getHabitId(), principal);
        validateRequest(request);

        Reminder reminder = new Reminder();
        reminder.setHabit(habit);
        reminder.setReminderTime(request.getReminderTime());
        reminder.setEnabled(request.getEnabled());
        reminder.setDaysCsv(ScheduleUtils.normalizeCsv(request.getDaysCsv()));

        return ReminderMapper.toResponse(reminderRepository.save(reminder));
    }

    public ReminderResponse updateReminder(UUID reminderId, ReminderRequest request, Principal principal) {
        Reminder reminder = reminderRepository.findById(reminderId)
            .orElseThrow(() -> new ResourceNotFoundException("Reminder not found"));

        Habit habit = getOwnedHabit(request.getHabitId(), principal);
        validateRequest(request);

        if (!reminder.getHabit().getId().equals(habit.getId())) {
            throw new BadRequestException("Reminder must belong to the specified habit");
        }

        reminder.setReminderTime(request.getReminderTime());
        reminder.setEnabled(request.getEnabled());
        reminder.setDaysCsv(ScheduleUtils.normalizeCsv(request.getDaysCsv()));

        return ReminderMapper.toResponse(reminderRepository.save(reminder));
    }

    public void deleteReminder(UUID reminderId, Principal principal) {
        Reminder reminder = reminderRepository.findById(reminderId)
            .orElseThrow(() -> new ResourceNotFoundException("Reminder not found"));

        getOwnedHabit(reminder.getHabit().getId(), principal);
        reminderRepository.delete(reminder);
    }

    private Habit getOwnedHabit(UUID habitId, Principal principal) {
        AppUser user = userRepository.findByUsername(principal.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return habitRepository.findByIdAndUser(habitId, user)
            .orElseThrow(() -> new ResourceNotFoundException("Habit not found"));
    }

    private void validateRequest(ReminderRequest request) {
        if (request.getDaysCsv() == null || request.getDaysCsv().isBlank()) {
            throw new BadRequestException("Reminder selected days are required");
        }
        ScheduleUtils.parseSelectedDays(request.getDaysCsv());
    }
}
