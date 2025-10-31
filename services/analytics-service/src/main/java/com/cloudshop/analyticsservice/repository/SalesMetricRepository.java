package com.cloudshop.analyticsservice.repository;

import com.cloudshop.analyticsservice.model.SalesMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SalesMetricRepository extends JpaRepository<SalesMetric, UUID> {
    
    Optional<SalesMetric> findByDateAndProductId(LocalDate date, String productId);
    
    List<SalesMetric> findByDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<SalesMetric> findByProductIdAndDateBetween(String productId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT SUM(sm.revenue) FROM SalesMetric sm WHERE sm.date BETWEEN :startDate AND :endDate")
    java.math.BigDecimal sumRevenueByDateRange(LocalDate startDate, LocalDate endDate);
}

