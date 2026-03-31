package dk.via.habittracker.backend.controller;

import dk.via.habittracker.backend.dto.category.CategoryRequest;
import dk.via.habittracker.backend.dto.category.CategoryResponse;
import dk.via.habittracker.backend.service.category.CategoryService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryResponse> getCategories(Principal principal) {
        return categoryService.getAllCategories(principal);
    }

    @PostMapping
    public CategoryResponse createCategory(@Valid @RequestBody CategoryRequest request, Principal principal) {
        return categoryService.createCategory(request, principal);
    }

    @PutMapping("/{categoryId}")
    public CategoryResponse updateCategory(@PathVariable UUID categoryId,
                                           @Valid @RequestBody CategoryRequest request,
                                           Principal principal) {
        return categoryService.updateCategory(categoryId, request, principal);
    }

    @DeleteMapping("/{categoryId}")
    public void deleteCategory(@PathVariable UUID categoryId, Principal principal) {
        categoryService.deleteCategory(categoryId, principal);
    }
}
