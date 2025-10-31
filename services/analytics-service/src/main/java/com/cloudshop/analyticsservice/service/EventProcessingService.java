package com.cloudshop.analyticsservice.service;

import com.cloudshop.analyticsservice.dto.*;
import com.cloudshop.analyticsservice.model.Event;
import com.cloudshop.analyticsservice.model.elasticsearch.EventDocument;
import com.cloudshop.analyticsservice.repository.EventRepository;
import com.cloudshop.analyticsservice.repository.elasticsearch.EventDocumentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventProcessingService {

    private final EventRepository eventRepository;
    private final EventDocumentRepository eventDocumentRepository;
    private final SalesAnalyticsService salesAnalyticsService;
    private final CustomerAnalyticsService customerAnalyticsService;
    private final ProductAnalyticsService productAnalyticsService;
    private final RevenueAnalyticsService revenueAnalyticsService;
    private final ObjectMapper objectMapper;

    @Transactional
    public void processOrderCreated(OrderCreatedEvent event) {
        try {
            // Save event to PostgreSQL
            Event dbEvent = saveEvent("order_created", event.getCustomerId(), null, 
                    event.getOrderId(), "order", event, event.getTimestamp());
            
            // Save to Elasticsearch
            saveEventToElasticsearch("order_created", event.getCustomerId(), null,
                    event.getOrderId(), "order", event, event.getTimestamp());
            
            // Process analytics
            salesAnalyticsService.updateSalesMetrics(event);
            customerAnalyticsService.updateCustomerMetrics(event);
            productAnalyticsService.updateProductPerformance(event);
            revenueAnalyticsService.updateRevenueMetrics(event);
            
            markEventAsProcessed(dbEvent);
            log.info("Processed order_created event for order: {}", event.getOrderId());
        } catch (Exception e) {
            log.error("Error processing order_created event", e);
            throw e;
        }
    }

    @Transactional
    public void processPaymentCompleted(PaymentCompletedEvent event) {
        try {
            Event dbEvent = saveEvent("payment_completed", event.getCustomerId(), null,
                    event.getPaymentId(), "payment", event, event.getTimestamp());
            
            saveEventToElasticsearch("payment_completed", event.getCustomerId(), null,
                    event.getPaymentId(), "payment", event, event.getTimestamp());
            
            revenueAnalyticsService.updateRevenueMetrics(event);
            
            markEventAsProcessed(dbEvent);
            log.info("Processed payment_completed event for payment: {}", event.getPaymentId());
        } catch (Exception e) {
            log.error("Error processing payment_completed event", e);
            throw e;
        }
    }

    @Transactional
    public void processProductViewed(ProductViewedEvent event) {
        try {
            Event dbEvent = saveEvent("product_viewed", event.getUserId(), event.getSessionId(),
                    event.getProductId(), "product", event, event.getTimestamp());
            
            saveEventToElasticsearch("product_viewed", event.getUserId(), event.getSessionId(),
                    event.getProductId(), "product", event, event.getTimestamp());
            
            productAnalyticsService.updateProductPerformance(event);
            customerAnalyticsService.updateCustomerMetrics(event);
            
            markEventAsProcessed(dbEvent);
            log.debug("Processed product_viewed event for product: {}", event.getProductId());
        } catch (Exception e) {
            log.error("Error processing product_viewed event", e);
            throw e;
        }
    }

    @Transactional
    public void processCustomerRegistered(CustomerRegisteredEvent event) {
        try {
            Event dbEvent = saveEvent("customer_registered", event.getCustomerId(), null,
                    event.getCustomerId(), "customer", event, event.getTimestamp());
            
            saveEventToElasticsearch("customer_registered", event.getCustomerId(), null,
                    event.getCustomerId(), "customer", event, event.getTimestamp());
            
            customerAnalyticsService.initializeCustomerMetrics(event);
            
            markEventAsProcessed(dbEvent);
            log.info("Processed customer_registered event for customer: {}", event.getCustomerId());
        } catch (Exception e) {
            log.error("Error processing customer_registered event", e);
            throw e;
        }
    }

    private Event saveEvent(String eventType, String userId, String sessionId,
                           String entityId, String entityType, Object payload, LocalDateTime timestamp) {
        try {
            String propertiesJson = objectMapper.writeValueAsString(payload);
            
            Event event = Event.builder()
                    .eventType(eventType)
                    .userId(userId)
                    .sessionId(sessionId)
                    .entityId(entityId)
                    .entityType(entityType)
                    .properties(propertiesJson)
                    .timestamp(timestamp != null ? timestamp : LocalDateTime.now())
                    .processed(false)
                    .build();
            
            return eventRepository.save(event);
        } catch (Exception e) {
            log.error("Error saving event to database", e);
            throw new RuntimeException("Failed to save event", e);
        }
    }

    private void saveEventToElasticsearch(String eventType, String userId, String sessionId,
                                        String entityId, String entityType, Object payload, LocalDateTime timestamp) {
        try {
            Map<String, Object> properties = objectMapper.convertValue(payload, Map.class);
            
            EventDocument document = EventDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .eventType(eventType)
                    .userId(userId)
                    .sessionId(sessionId)
                    .entityId(entityId)
                    .entityType(entityType)
                    .properties(properties)
                    .timestamp(timestamp != null ? timestamp : LocalDateTime.now())
                    .build();
            
            eventDocumentRepository.save(document);
        } catch (Exception e) {
            log.error("Error saving event to Elasticsearch", e);
            // Don't throw - Elasticsearch failures shouldn't block event processing
        }
    }

    private void markEventAsProcessed(Event event) {
        event.setProcessed(true);
        event.setProcessedAt(LocalDateTime.now());
        eventRepository.save(event);
    }
}

