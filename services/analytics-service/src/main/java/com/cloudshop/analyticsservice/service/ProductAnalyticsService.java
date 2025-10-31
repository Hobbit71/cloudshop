package com.cloudshop.analyticsservice.service;

import com.cloudshop.analyticsservice.dto.OrderCreatedEvent;
import com.cloudshop.analyticsservice.dto.ProductViewedEvent;
import com.cloudshop.analyticsservice.model.ProductPerformance;
import com.cloudshop.analyticsservice.repository.ProductPerformanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductAnalyticsService {

    private final ProductPerformanceRepository productPerformanceRepository;
    // In-memory cache for unique viewers per product per day
    // In production, consider using Redis for distributed systems
    private final ConcurrentHashMap<String, Set<String>> dailyUniqueViewers = new ConcurrentHashMap<>();

    @Transactional
    public void updateProductPerformance(ProductViewedEvent event) {
        LocalDate date = LocalDate.now();
        String productId = event.getProductId();
        String cacheKey = productId + "_" + date.toString();
        
        Optional<ProductPerformance> existingMetric = productPerformanceRepository.findByProductIdAndDate(productId, date);
        
        ProductPerformance metric;
        if (existingMetric.isPresent()) {
            metric = existingMetric.get();
            metric.setViews(metric.getViews() + 1);
            
            // Track unique views
            if (event.getUserId() != null) {
                dailyUniqueViewers.computeIfAbsent(cacheKey, k -> new HashSet<>()).add(event.getUserId());
                metric.setUniqueViews((long) dailyUniqueViewers.get(cacheKey).size());
            }
        } else {
            metric = ProductPerformance.builder()
                    .productId(productId)
                    .date(date)
                    .views(1L)
                    .uniqueViews(event.getUserId() != null ? 1L : 0L)
                    .orders(0L)
                    .quantitySold(0L)
                    .revenue(BigDecimal.ZERO)
                    .build();
            
            if (event.getUserId() != null) {
                dailyUniqueViewers.put(cacheKey, new HashSet<>());
                dailyUniqueViewers.get(cacheKey).add(event.getUserId());
            }
        }
        
        // Calculate conversion rate (orders / views)
        if (metric.getViews() > 0 && metric.getOrders() > 0) {
            metric.setConversionRate(
                BigDecimal.valueOf(metric.getOrders())
                    .divide(BigDecimal.valueOf(metric.getViews()), 4, RoundingMode.HALF_UP)
            );
        }
        
        productPerformanceRepository.save(metric);
        log.debug("Updated product performance for product: {}", productId);
    }

    @Transactional
    public void updateProductPerformance(OrderCreatedEvent event) {
        if (event.getItems() == null || event.getItems().isEmpty()) {
            return;
        }

        LocalDate date = LocalDate.now();
        
        for (OrderCreatedEvent.OrderItem item : event.getItems()) {
            String productId = item.getProductId();
            Optional<ProductPerformance> existingMetric = productPerformanceRepository.findByProductIdAndDate(productId, date);
            
            ProductPerformance metric;
            if (existingMetric.isPresent()) {
                metric = existingMetric.get();
                metric.setOrders(metric.getOrders() + 1);
                metric.setQuantitySold(metric.getQuantitySold() + item.getQuantity());
                metric.setRevenue(metric.getRevenue().add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))));
            } else {
                metric = ProductPerformance.builder()
                        .productId(productId)
                        .date(date)
                        .views(0L)
                        .uniqueViews(0L)
                        .orders(1L)
                        .quantitySold((long) item.getQuantity())
                        .revenue(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .build();
            }
            
            // Calculate conversion rate (orders / views)
            if (metric.getViews() > 0 && metric.getOrders() > 0) {
                metric.setConversionRate(
                    BigDecimal.valueOf(metric.getOrders())
                        .divide(BigDecimal.valueOf(metric.getViews()), 4, RoundingMode.HALF_UP)
                );
            }
            
            productPerformanceRepository.save(metric);
            log.debug("Updated product performance for product: {} from order", productId);
        }
    }

    public ProductPerformance getProductPerformance(LocalDate date, String productId) {
        return productPerformanceRepository.findByProductIdAndDate(productId, date)
                .orElse(null);
    }
}
