package dk.via.habittracker.backend.controller;

import dk.via.habittracker.backend.dto.profile.ProfileResponse;
import dk.via.habittracker.backend.dto.profile.ProfileUpdateRequest;
import dk.via.habittracker.backend.service.profile.ProfileService;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController
{
  private final ProfileService profileService;

  public ProfileController(ProfileService profileService)
  {
    this.profileService = profileService;
  }

  @GetMapping
  public ProfileResponse getProfile(Principal principal)
  {
    return profileService.getProfile(principal);
  }

  @PutMapping
  public ProfileResponse updateProfile(@RequestBody ProfileUpdateRequest request, Principal principal)
  {
    return profileService.updateProfile(request, principal);
  }
}