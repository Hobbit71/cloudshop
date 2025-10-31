package com.cloudshop.productservice.service;

import com.cloudshop.productservice.dto.CategoryResponse;
import com.cloudshop.productservice.exception.ResourceNotFoundException;
import com.cloudshop.productservice.model.Category;
import com.cloudshop.productservice.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;

    @Transactional(readOnly = true)
    @Cacheable(value = "categories")
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findByIsActive(true).stream()
                .map(productMapper::toCategoryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "category", key = "#id")
    public CategoryResponse getCategoryById(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return productMapper.toCategoryResponse(category);
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with slug: " + slug));
        return productMapper.toCategoryResponse(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategoriesByParent(UUID parentId) {
        List<Category> categories = categoryRepository.findByParentIdAndIsActive(parentId, true);
        return categories.stream()
                .map(productMapper::toCategoryResponse)
                .collect(Collectors.toList());
    }
}

