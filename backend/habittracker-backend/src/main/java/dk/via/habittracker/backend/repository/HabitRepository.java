package dk.via.habittracker.backend.repository;

import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.Habit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HabitRepository extends JpaRepository<Habit, UUID>
{
  List<Habit> findByUserOrderByCreatedAtDesc(AppUser user);
  List<Habit> findByUserAndActiveTrueOrderByCreatedAtDesc(AppUser user);
  Optional<Habit> findByIdAndUser(UUID id, AppUser user);
}