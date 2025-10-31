package com.cloudshop.analyticsservice.controller;

import com.cloudshop.analyticsservice.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final SalesAnalyticsService salesAnalyticsService;
    private final CustomerAnalyticsService customerAnalyticsService;
    private final ProductAnalyticsService productAnalyticsService;
    private final RevenueAnalyticsService revenueAnalyticsService;
    private final ReportGenerationService reportGenerationService;

    @GetMapping("/sales")
    public ResponseEntity<Map<String, Object>> getSalesAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String productId) {
        
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        
        Map<String, Object> report = reportGenerationService.generateSalesReport(start, end, productId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/revenue")
    public ResponseEntity<Map<String, Object>> getRevenueAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String periodType) {
        
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        
        Map<String, Object> report = reportGenerationService.generateRevenueReport(start, end, periodType);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<Map<String, Object>> getCustomerAnalytics(
            @PathVariable String customerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        
        Map<String, Object> report = reportGenerationService.generateCustomerReport(customerId, start, end);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<Map<String, Object>> getProductAnalytics(
            @PathVariable String productId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        
        Map<String, Object> report = reportGenerationService.generateProductPerformanceReport(productId, start, end);
        return ResponseEntity.ok(report);
    }

    @PostMapping("/reports/custom")
    public ResponseEntity<Map<String, Object>> generateCustomReport(@RequestBody Map<String, Object> parameters) {
        Map<String, Object> report = reportGenerationService.generateCustomReport(parameters);
        return ResponseEntity.ok(report);
    }
}

