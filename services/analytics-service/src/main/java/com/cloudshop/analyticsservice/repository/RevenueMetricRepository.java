package com.cloudshop.analyticsservice.repository;

import com.cloudshop.analyticsservice.model.RevenueMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface RevenueMetricRepository extends JpaRepository<RevenueMetric, UUID> {
    
    RevenueMetric findByDateAndPeriodType(LocalDate date, String periodType);
    
    List<RevenueMetric> findByDateBetween(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT SUM(rm.totalRevenue) FROM RevenueMetric rm WHERE rm.date BETWEEN :startDate AND :endDate")
    java.math.BigDecimal sumRevenueByDateRange(LocalDate startDate, LocalDate endDate);
}

