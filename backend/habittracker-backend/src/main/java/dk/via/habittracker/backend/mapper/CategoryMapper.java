package dk.via.habittracker.backend.mapper;

import dk.via.habittracker.backend.dto.category.CategoryResponse;
import dk.via.habittracker.backend.entity.Category;

public final class CategoryMapper {
    private CategoryMapper() {
    }

    public static CategoryResponse toResponse(Category category) {
        CategoryResponse response = new CategoryResponse();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setDescription(category.getDescription());
        response.setCreatedAt(category.getCreatedAt());
        return response;
    }
}
