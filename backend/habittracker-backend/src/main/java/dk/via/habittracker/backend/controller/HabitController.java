package dk.via.habittracker.backend.controller;

import dk.via.habittracker.backend.dto.habit.HabitRequest;
import dk.via.habittracker.backend.dto.habit.HabitResponse;
import dk.via.habittracker.backend.dto.habit.ReorderHabitsRequest;
import dk.via.habittracker.backend.service.habit.HabitService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/habits")
public class HabitController {
    private final HabitService habitService;

    public HabitController(HabitService habitService) {
        this.habitService = habitService;
    }

    @GetMapping
    public List<HabitResponse> getAllHabits(Principal principal) {
        return habitService.getAllHabits(principal);
    }

    @GetMapping("/{habitId}")
    public HabitResponse getHabitById(@PathVariable UUID habitId, Principal principal) {
        return habitService.getHabitById(habitId, principal);
    }

    @PostMapping
    public HabitResponse createHabit(@Valid @RequestBody HabitRequest request, Principal principal) {
        return habitService.createHabit(request, principal);
    }

    @PutMapping("/{habitId}")
    public HabitResponse updateHabit(@PathVariable UUID habitId,
            @Valid @RequestBody HabitRequest request,
            Principal principal) {
        return habitService.updateHabit(habitId, request, principal);
    }

    @PatchMapping("/order")
    public void reorderHabits(@Valid @RequestBody ReorderHabitsRequest request, Principal principal) {
        habitService.reorderHabits(request.getHabitIds(), principal);
    }

    @DeleteMapping("/{habitId}")
    public void deleteHabit(@PathVariable UUID habitId, Principal principal) {
        habitService.deleteHabit(habitId, principal);
    }
}