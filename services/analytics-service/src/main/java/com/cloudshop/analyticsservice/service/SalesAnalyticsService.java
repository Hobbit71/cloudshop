package com.cloudshop.analyticsservice.service;

import com.cloudshop.analyticsservice.dto.OrderCreatedEvent;
import com.cloudshop.analyticsservice.model.SalesMetric;
import com.cloudshop.analyticsservice.repository.SalesMetricRepository;
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
public class SalesAnalyticsService {

    private final SalesMetricRepository salesMetricRepository;

    @Transactional
    public void updateSalesMetrics(OrderCreatedEvent event) {
        LocalDate date = LocalDate.now();
        
        if (event.getItems() == null || event.getItems().isEmpty()) {
            return;
        }

        for (OrderCreatedEvent.OrderItem item : event.getItems()) {
            updateSalesMetricForProduct(date, item, event.getTotalAmount());
        }
    }

    private void updateSalesMetricForProduct(LocalDate date, OrderCreatedEvent.OrderItem item, BigDecimal orderTotal) {
        String productId = item.getProductId();
        
        Optional<SalesMetric> existingMetric = salesMetricRepository.findByDateAndProductId(date, productId);
        
        SalesMetric metric;
        if (existingMetric.isPresent()) {
            metric = existingMetric.get();
            metric.setOrderCount(metric.getOrderCount() + 1);
            metric.setQuantitySold(metric.getQuantitySold() + item.getQuantity());
            metric.setRevenue(metric.getRevenue().add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))));
        } else {
            metric = SalesMetric.builder()
                    .date(date)
                    .productId(productId)
                    .categoryId(item.getCategoryId())
                    .orderCount(1L)
                    .quantitySold((long) item.getQuantity())
                    .revenue(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .build();
        }
        
        // Calculate average order value
        if (metric.getOrderCount() > 0) {
            metric.setAverageOrderValue(
                metric.getRevenue().divide(BigDecimal.valueOf(metric.getOrderCount()), 2, RoundingMode.HALF_UP)
            );
        }
        
        salesMetricRepository.save(metric);
        log.debug("Updated sales metric for product: {} on date: {}", productId, date);
    }

    public SalesMetric getSalesMetric(LocalDate date, String productId) {
        return salesMetricRepository.findByDateAndProductId(date, productId)
                .orElse(null);
    }
}

