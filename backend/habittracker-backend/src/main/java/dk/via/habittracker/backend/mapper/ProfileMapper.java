package dk.via.habittracker.backend.mapper;

import dk.via.habittracker.backend.dto.profile.ProfileResponse;
import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.UserPreference;

public final class ProfileMapper {
    private ProfileMapper() {
    }

    public static ProfileResponse toResponse(AppUser user, UserPreference preference) {
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
