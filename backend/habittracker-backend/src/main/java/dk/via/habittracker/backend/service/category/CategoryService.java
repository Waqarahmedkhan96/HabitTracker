package dk.via.habittracker.backend.service.category;

import dk.via.habittracker.backend.dto.category.CategoryRequest;
import dk.via.habittracker.backend.dto.category.CategoryResponse;
import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.Category;
import dk.via.habittracker.backend.exception.BadRequestException;
import dk.via.habittracker.backend.exception.ConflictException;
import dk.via.habittracker.backend.exception.ResourceNotFoundException;
import dk.via.habittracker.backend.mapper.CategoryMapper;
import dk.via.habittracker.backend.repository.AppUserRepository;
import dk.via.habittracker.backend.repository.CategoryRepository;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final AppUserRepository userRepository;

    public CategoryService(CategoryRepository categoryRepository, AppUserRepository userRepository) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    public List<CategoryResponse> getAllCategories(Principal principal) {
        AppUser user = getCurrentUser(principal);
        return categoryRepository.findByUserOrderByNameAsc(user).stream()
            .map(CategoryMapper::toResponse)
            .toList();
    }

    public CategoryResponse createCategory(CategoryRequest request, Principal principal) {
        AppUser user = getCurrentUser(principal);
        validateCategoryRequest(request);
        if (categoryRepository.findByUserAndNameIgnoreCase(user, request.getName()).isPresent()) {
            throw new ConflictException("Category name already exists");
        }

        Category category = new Category();
        category.setUser(user);
        category.setName(request.getName());
        category.setDescription(request.getDescription());

        return CategoryMapper.toResponse(categoryRepository.save(category));
    }

    public CategoryResponse updateCategory(UUID categoryId, CategoryRequest request, Principal principal) {
        AppUser user = getCurrentUser(principal);
        validateCategoryRequest(request);

        Category category = categoryRepository.findByIdAndUser(categoryId, user)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        categoryRepository.findByUserAndNameIgnoreCase(user, request.getName())
            .filter(existing -> !existing.getId().equals(category.getId()))
            .ifPresent(existing -> { throw new ConflictException("Category name already exists"); });

        category.setName(request.getName());
        category.setDescription(request.getDescription());

        return CategoryMapper.toResponse(categoryRepository.save(category));
    }

    public void deleteCategory(UUID categoryId, Principal principal) {
        AppUser user = getCurrentUser(principal);
        Category category = categoryRepository.findByIdAndUser(categoryId, user)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        categoryRepository.delete(category);
    }

    private AppUser getCurrentUser(Principal principal) {
        return userRepository.findByUsername(principal.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void validateCategoryRequest(CategoryRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BadRequestException("Category name is required");
        }
    }
}
