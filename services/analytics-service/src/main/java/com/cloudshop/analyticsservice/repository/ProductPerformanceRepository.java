package com.cloudshop.analyticsservice.repository;

import com.cloudshop.analyticsservice.model.ProductPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductPerformanceRepository extends JpaRepository<ProductPerformance, UUID> {
    
    Optional<ProductPerformance> findByProductIdAndDate(String productId, LocalDate date);
}

