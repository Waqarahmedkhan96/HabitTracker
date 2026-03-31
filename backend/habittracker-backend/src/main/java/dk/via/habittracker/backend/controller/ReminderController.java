package dk.via.habittracker.backend.controller;

import dk.via.habittracker.backend.dto.reminder.ReminderRequest;
import dk.via.habittracker.backend.dto.reminder.ReminderResponse;
import dk.via.habittracker.backend.service.reminder.ReminderService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/habits/{habitId}/reminders")
public class ReminderController {
    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @GetMapping
    public List<ReminderResponse> getReminders(@PathVariable UUID habitId, Principal principal) {
        return reminderService.getReminders(habitId, principal);
    }

    @PostMapping
    public ReminderResponse createReminder(@PathVariable UUID habitId,
                                           @Valid @RequestBody ReminderRequest request,
                                           Principal principal) {
        request.setHabitId(habitId);
        return reminderService.createReminder(request, principal);
    }

    @PutMapping("/{reminderId}")
    public ReminderResponse updateReminder(@PathVariable UUID habitId,
                                           @PathVariable UUID reminderId,
                                           @Valid @RequestBody ReminderRequest request,
                                           Principal principal) {
        request.setHabitId(habitId);
        return reminderService.updateReminder(reminderId, request, principal);
    }

    @DeleteMapping("/{reminderId}")
    public void deleteReminder(@PathVariable UUID habitId,
                               @PathVariable UUID reminderId,
                               Principal principal) {
        reminderService.deleteReminder(reminderId, principal);
    }
}
