package dk.via.habittracker.backend.controller;

import dk.via.habittracker.backend.dto.habit.HabitEntryRequest;
import dk.via.habittracker.backend.dto.habit.HabitEntryResponse;
import dk.via.habittracker.backend.service.habit.HabitEntryService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/habits/{habitId}/entries")
public class HabitEntryController
{
  private final HabitEntryService habitEntryService;

  public HabitEntryController(HabitEntryService habitEntryService)
  {
    this.habitEntryService = habitEntryService;
  }

  @GetMapping
  public List<HabitEntryResponse> getEntries(@PathVariable UUID habitId, Principal principal)
  {
    return habitEntryService.getEntries(habitId, principal);
  }

  @PostMapping
  public HabitEntryResponse saveEntry(@PathVariable UUID habitId,
                                      @Valid @RequestBody HabitEntryRequest request,
                                      Principal principal)
  {
    return habitEntryService.saveEntry(habitId, request, principal);
  }

  @PutMapping("/{entryId}")
  public HabitEntryResponse updateEntry(@PathVariable UUID habitId,
                                        @PathVariable UUID entryId,
                                        @Valid @RequestBody HabitEntryRequest request,
                                        Principal principal)
  {
    return habitEntryService.updateEntry(habitId, entryId, request, principal);
  }
}