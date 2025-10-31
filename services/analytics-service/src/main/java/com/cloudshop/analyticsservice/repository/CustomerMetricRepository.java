package com.cloudshop.analyticsservice.repository;

import com.cloudshop.analyticsservice.model.CustomerMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerMetricRepository extends JpaRepository<CustomerMetric, UUID> {
    
    Optional<CustomerMetric> findByCustomerIdAndDate(String customerId, LocalDate date);
}

