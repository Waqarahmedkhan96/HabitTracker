package dk.via.habittracker.backend.service.profile;

import dk.via.habittracker.backend.dto.profile.ProfileResponse;
import dk.via.habittracker.backend.dto.profile.ProfileUpdateRequest;
import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.UserPreference;
import dk.via.habittracker.backend.repository.AppUserRepository;
import dk.via.habittracker.backend.repository.UserPreferenceRepository;
import java.security.Principal;
import org.springframework.stereotype.Service;

@Service
public class ProfileService
{
  private final AppUserRepository userRepository;
  private final UserPreferenceRepository preferenceRepository;

  public ProfileService(AppUserRepository userRepository, UserPreferenceRepository preferenceRepository)
  {
    this.userRepository = userRepository;
    this.preferenceRepository = preferenceRepository;
  }

  public ProfileResponse getProfile(Principal principal)
  {
    AppUser user = getCurrentUser(principal);
    UserPreference preference = getOrCreatePreference(user);
    return mapToResponse(user, preference);
  }

  public ProfileResponse updateProfile(ProfileUpdateRequest request, Principal principal)
  {
    AppUser user = getCurrentUser(principal);
    UserPreference preference = getOrCreatePreference(user);

    if (request.getFirstName() != null)
    {
      user.setFirstName(request.getFirstName());
    }

    if (request.getLastName() != null)
    {
      user.setLastName(request.getLastName());
    }

    if (request.getThemeMode() != null)
    {
      preference.setThemeMode(request.getThemeMode());
    }

    if (request.getEmailNotifications() != null)
    {
      preference.setEmailNotifications(request.getEmailNotifications());
    }

    if (request.getPushNotifications() != null)
    {
      preference.setPushNotifications(request.getPushNotifications());
    }

    userRepository.save(user);
    preferenceRepository.save(preference);

    return mapToResponse(user, preference);
  }

  private AppUser getCurrentUser(Principal principal)
  {
    return userRepository.findByEmail(principal.getName())
        .orElseThrow(() -> new RuntimeException("User not found"));
  }

  private UserPreference getOrCreatePreference(AppUser user)
  {
    return preferenceRepository.findByUser(user).orElseGet(() ->
    {
      UserPreference preference = new UserPreference();
      preference.setUser(user);
      return preferenceRepository.save(preference);
    });
  }

  private ProfileResponse mapToResponse(AppUser user, UserPreference preference)
  {
    ProfileResponse response = new ProfileResponse();
    response.setId(user.getId());
    response.setEmail(user.getEmail());
    response.setUsername(user.getUsername());
    response.setFirstName(user.getFirstName());
    response.setLastName(user.getLastName());
    response.setThemeMode(preference.getThemeMode());
    response.setEmailNotifications(preference.getEmailNotifications());
    response.setPushNotifications(preference.getPushNotifications());
    return response;
  }
}