package com.cloudshop.productservice.repository;

import com.cloudshop.productservice.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Page<Review> findByProductId(UUID productId, Pageable pageable);

    Page<Review> findByProductIdAndIsVisible(UUID productId, Boolean isVisible, Pageable pageable);

    Page<Review> findByUserId(UUID userId, Pageable pageable);

    List<Review> findByProductIdAndIsVisible(UUID productId, Boolean isVisible);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId AND r.isVisible = true")
    Double findAverageRatingByProductId(@Param("productId") UUID productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId AND r.isVisible = true")
    Long countByProductId(@Param("productId") UUID productId);
}

