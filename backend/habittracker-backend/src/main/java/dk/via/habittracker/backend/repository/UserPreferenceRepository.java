package dk.via.habittracker.backend.repository;

import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.UserPreference;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPreferenceRepository extends JpaRepository<UserPreference, UUID>
{
  Optional<UserPreference> findByUser(AppUser user);
}