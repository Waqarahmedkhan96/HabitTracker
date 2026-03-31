package dk.via.habittracker.backend.repository;

import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.Category;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, UUID>
{
  List<Category> findByUserOrderByNameAsc(AppUser user);
  Optional<Category> findByIdAndUser(UUID id, AppUser user);
  Optional<Category> findByUserAndNameIgnoreCase(AppUser user, String name);
}