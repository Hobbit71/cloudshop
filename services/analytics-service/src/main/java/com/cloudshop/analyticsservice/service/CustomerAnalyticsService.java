package com.cloudshop.analyticsservice.service;

import com.cloudshop.analyticsservice.dto.CustomerRegisteredEvent;
import com.cloudshop.analyticsservice.dto.OrderCreatedEvent;
import com.cloudshop.analyticsservice.dto.ProductViewedEvent;
import com.cloudshop.analyticsservice.model.CustomerMetric;
import com.cloudshop.analyticsservice.repository.CustomerMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerAnalyticsService {

    private final CustomerMetricRepository customerMetricRepository;

    @Transactional
    public void initializeCustomerMetrics(CustomerRegisteredEvent event) {
        LocalDate date = LocalDate.now();
        
        CustomerMetric metric = CustomerMetric.builder()
                .customerId(event.getCustomerId())
                .date(date)
                .orderCount(0L)
                .totalRevenue(BigDecimal.ZERO)
                .productViews(0L)
                .build();
        
        customerMetricRepository.save(metric);
        log.debug("Initialized customer metrics for customer: {}", event.getCustomerId());
    }

    @Transactional
    public void updateCustomerMetrics(OrderCreatedEvent event) {
        if (event.getCustomerId() == null) {
            return;
        }
        
        LocalDate date = LocalDate.now();
        Optional<CustomerMetric> existingMetric = customerMetricRepository.findByCustomerIdAndDate(
                event.getCustomerId(), date);
        
        CustomerMetric metric;
        if (existingMetric.isPresent()) {
            metric = existingMetric.get();
            metric.setOrderCount(metric.getOrderCount() + 1);
            metric.setTotalRevenue(metric.getTotalRevenue().add(event.getTotalAmount()));
            metric.setLastOrderDate(date);
        } else {
            metric = CustomerMetric.builder()
                    .customerId(event.getCustomerId())
                    .date(date)
                    .orderCount(1L)
                    .totalRevenue(event.getTotalAmount())
                    .lastOrderDate(date)
                    .productViews(0L)
                    .build();
        }
        
        // Calculate average order value
        if (metric.getOrderCount() > 0) {
            metric.setAverageOrderValue(
                metric.getTotalRevenue().divide(BigDecimal.valueOf(metric.getOrderCount()), 2, RoundingMode.HALF_UP)
            );
        }
        
        customerMetricRepository.save(metric);
        log.debug("Updated customer metrics for customer: {}", event.getCustomerId());
    }

    @Transactional
    public void updateCustomerMetrics(ProductViewedEvent event) {
        if (event.getUserId() == null) {
            return;
        }
        
        LocalDate date = LocalDate.now();
        Optional<CustomerMetric> existingMetric = customerMetricRepository.findByCustomerIdAndDate(
                event.getUserId(), date);
        
        CustomerMetric metric;
        if (existingMetric.isPresent()) {
            metric = existingMetric.get();
            metric.setProductViews(metric.getProductViews() + 1);
        } else {
            metric = CustomerMetric.builder()
                    .customerId(event.getUserId())
                    .date(date)
                    .orderCount(0L)
                    .totalRevenue(BigDecimal.ZERO)
                    .productViews(1L)
                    .build();
        }
        
        customerMetricRepository.save(metric);
        log.debug("Updated product views for customer: {}", event.getUserId());
    }
}

