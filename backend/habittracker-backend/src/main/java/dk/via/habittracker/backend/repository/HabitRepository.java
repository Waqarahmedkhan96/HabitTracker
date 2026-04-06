package dk.via.habittracker.backend.repository;

import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.Habit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HabitRepository extends JpaRepository<Habit, UUID>
{
  List<Habit> findByUserOrderByCreatedAtAsc(AppUser user);
  List<Habit> findByUserOrderByDisplayOrderAsc(AppUser user);
  List<Habit> findByUserAndActiveTrueOrderByDisplayOrderAsc(AppUser user);
  Optional<Habit> findByIdAndUser(UUID id, AppUser user);
}