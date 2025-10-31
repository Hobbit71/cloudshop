package com.cloudshop.analyticsservice.service;

import com.cloudshop.analyticsservice.model.*;
import com.cloudshop.analyticsservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportGenerationService {

    private final SalesMetricRepository salesMetricRepository;
    private final CustomerMetricRepository customerMetricRepository;
    private final ProductPerformanceRepository productPerformanceRepository;
    private final RevenueMetricRepository revenueMetricRepository;

    public Map<String, Object> generateSalesReport(LocalDate startDate, LocalDate endDate, String productId) {
        Map<String, Object> report = new HashMap<>();
        
        List<SalesMetric> metrics;
        if (productId != null) {
            metrics = salesMetricRepository.findByProductIdAndDateBetween(productId, startDate, endDate);
        } else {
            metrics = salesMetricRepository.findByDateBetween(startDate, endDate);
        }
        
        BigDecimal totalRevenue = metrics.stream()
                .map(SalesMetric::getRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        Long totalOrders = metrics.stream()
                .mapToLong(SalesMetric::getOrderCount)
                .sum();
        
        Long totalQuantity = metrics.stream()
                .mapToLong(SalesMetric::getQuantitySold)
                .sum();
        
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("totalRevenue", totalRevenue);
        report.put("totalOrders", totalOrders);
        report.put("totalQuantitySold", totalQuantity);
        report.put("averageOrderValue", totalOrders > 0 ? 
                totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
        report.put("metrics", metrics);
        
        return report;
    }

    public Map<String, Object> generateCustomerReport(String customerId, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> report = new HashMap<>();
        
        List<CustomerMetric> metrics = customerMetricRepository.findAll().stream()
                .filter(m -> m.getCustomerId().equals(customerId))
                .filter(m -> !m.getDate().isBefore(startDate) && !m.getDate().isAfter(endDate))
                .toList();
        
        BigDecimal totalRevenue = metrics.stream()
                .map(CustomerMetric::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        Long totalOrders = metrics.stream()
                .mapToLong(CustomerMetric::getOrderCount)
                .sum();
        
        Long totalViews = metrics.stream()
                .mapToLong(CustomerMetric::getProductViews)
                .sum();
        
        report.put("customerId", customerId);
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("totalRevenue", totalRevenue);
        report.put("totalOrders", totalOrders);
        report.put("totalProductViews", totalViews);
        report.put("averageOrderValue", totalOrders > 0 ? 
                totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
        report.put("metrics", metrics);
        
        return report;
    }

    public Map<String, Object> generateProductPerformanceReport(String productId, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> report = new HashMap<>();
        
        List<ProductPerformance> metrics = productPerformanceRepository.findAll().stream()
                .filter(m -> m.getProductId().equals(productId))
                .filter(m -> !m.getDate().isBefore(startDate) && !m.getDate().isAfter(endDate))
                .toList();
        
        Long totalViews = metrics.stream()
                .mapToLong(ProductPerformance::getViews)
                .sum();
        
        Long totalOrders = metrics.stream()
                .mapToLong(ProductPerformance::getOrders)
                .sum();
        
        BigDecimal totalRevenue = metrics.stream()
                .map(ProductPerformance::getRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal conversionRate = totalViews > 0 ? 
                BigDecimal.valueOf(totalOrders).divide(BigDecimal.valueOf(totalViews), 4, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
        
        report.put("productId", productId);
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("totalViews", totalViews);
        report.put("totalOrders", totalOrders);
        report.put("totalRevenue", totalRevenue);
        report.put("conversionRate", conversionRate);
        report.put("metrics", metrics);
        
        return report;
    }

    public Map<String, Object> generateRevenueReport(LocalDate startDate, LocalDate endDate, String periodType) {
        Map<String, Object> report = new HashMap<>();
        
        List<RevenueMetric> metrics = revenueMetricRepository.findByDateBetween(startDate, endDate);
        
        if (periodType != null) {
            metrics = metrics.stream()
                    .filter(m -> m.getPeriodType().equals(periodType))
                    .toList();
        }
        
        BigDecimal totalRevenue = metrics.stream()
                .map(RevenueMetric::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal netRevenue = metrics.stream()
                .map(RevenueMetric::getNetRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal refundAmount = metrics.stream()
                .map(RevenueMetric::getRefundAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        Long totalOrders = metrics.stream()
                .mapToLong(RevenueMetric::getOrderCount)
                .sum();
        
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("periodType", periodType != null ? periodType : "ALL");
        report.put("totalRevenue", totalRevenue);
        report.put("netRevenue", netRevenue);
        report.put("refundAmount", refundAmount);
        report.put("totalOrders", totalOrders);
        report.put("averageOrderValue", totalOrders > 0 ? 
                totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
        report.put("metrics", metrics);
        
        return report;
    }

    public Map<String, Object> generateCustomReport(Map<String, Object> parameters) {
        Map<String, Object> report = new HashMap<>();
        
        // Extract parameters
        String reportType = (String) parameters.getOrDefault("type", "sales");
        LocalDate startDate = parameters.get("startDate") instanceof LocalDate ? 
                (LocalDate) parameters.get("startDate") : LocalDate.now().minusDays(30);
        LocalDate endDate = parameters.get("endDate") instanceof LocalDate ? 
                (LocalDate) parameters.get("endDate") : LocalDate.now();
        
        switch (reportType.toLowerCase()) {
            case "sales" -> {
                String productId = (String) parameters.get("productId");
                report = generateSalesReport(startDate, endDate, productId);
            }
            case "revenue" -> {
                String periodType = (String) parameters.get("periodType");
                report = generateRevenueReport(startDate, endDate, periodType);
            }
            case "product" -> {
                String productId = (String) parameters.get("productId");
                if (productId == null) {
                    throw new IllegalArgumentException("productId is required for product report");
                }
                report = generateProductPerformanceReport(productId, startDate, endDate);
            }
            case "customer" -> {
                String customerId = (String) parameters.get("customerId");
                if (customerId == null) {
                    throw new IllegalArgumentException("customerId is required for customer report");
                }
                report = generateCustomerReport(customerId, startDate, endDate);
            }
            default -> throw new IllegalArgumentException("Unknown report type: " + reportType);
        }
        
        report.put("generatedAt", java.time.LocalDateTime.now());
        return report;
    }
}

