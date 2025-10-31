package com.cloudshop.analyticsservice.service;

import com.cloudshop.analyticsservice.dto.OrderCreatedEvent;
import com.cloudshop.analyticsservice.dto.PaymentCompletedEvent;
import com.cloudshop.analyticsservice.model.RevenueMetric;
import com.cloudshop.analyticsservice.repository.RevenueMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class RevenueAnalyticsService {

    private final RevenueMetricRepository revenueMetricRepository;

    @Transactional
    public void updateRevenueMetrics(OrderCreatedEvent event) {
        LocalDate date = LocalDate.now();
        updateRevenueMetric(date, "DAILY", event.getTotalAmount(), 1L);
    }

    @Transactional
    public void updateRevenueMetrics(PaymentCompletedEvent event) {
        LocalDate date = LocalDate.now();
        updateRevenueMetric(date, "DAILY", event.getAmount(), 1L);
    }

    private void updateRevenueMetric(LocalDate date, String periodType, BigDecimal amount, Long orderCount) {
        RevenueMetric metric = revenueMetricRepository.findByDateAndPeriodType(date, periodType);
        
        if (metric == null) {
            metric = RevenueMetric.builder()
                    .date(date)
                    .periodType(periodType)
                    .totalRevenue(amount)
                    .orderCount(orderCount)
                    .refundAmount(BigDecimal.ZERO)
                    .netRevenue(amount)
                    .build();
        } else {
            metric.setTotalRevenue(metric.getTotalRevenue().add(amount));
            metric.setOrderCount(metric.getOrderCount() + orderCount);
            metric.setNetRevenue(metric.getTotalRevenue().subtract(metric.getRefundAmount()));
        }
        
        // Calculate average order value
        if (metric.getOrderCount() > 0) {
            metric.setAverageOrderValue(
                metric.getTotalRevenue().divide(BigDecimal.valueOf(metric.getOrderCount()), 2, RoundingMode.HALF_UP)
            );
        }
        
        revenueMetricRepository.save(metric);
        log.debug("Updated revenue metric for date: {} period: {}", date, periodType);
    }

    public RevenueMetric getRevenueMetric(LocalDate date, String periodType) {
        return revenueMetricRepository.findByDateAndPeriodType(date, periodType);
    }
}

