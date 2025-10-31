package com.cloudshop.productservice.repository;

import com.cloudshop.productservice.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findBySlug(String slug);

    List<Category> findByParentId(UUID parentId);

    List<Category> findByParentIsNull();

    List<Category> findByIsActive(Boolean isActive);

    List<Category> findByParentIdAndIsActive(UUID parentId, Boolean isActive);

    boolean existsBySlug(String slug);
}

