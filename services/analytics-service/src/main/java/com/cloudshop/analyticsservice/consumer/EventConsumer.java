package com.cloudshop.analyticsservice.consumer;

import com.cloudshop.analyticsservice.dto.*;
import com.cloudshop.analyticsservice.service.EventProcessingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventConsumer {

    private final EventProcessingService eventProcessingService;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.topics.order-created}")
    private String orderCreatedTopic;

    @Value("${app.kafka.topics.payment-completed}")
    private String paymentCompletedTopic;

    @Value("${app.kafka.topics.product-viewed}")
    private String productViewedTopic;

    @Value("${app.kafka.topics.customer-registered}")
    private String customerRegisteredTopic;

    @KafkaListener(topics = "${app.kafka.topics.order-created}", groupId = "${spring.kafka.consumer.group-id}")
    public void consumeOrderCreated(String message) {
        try {
            log.debug("Received order_created event: {}", message);
            OrderCreatedEvent event = objectMapper.readValue(message, OrderCreatedEvent.class);
            eventProcessingService.processOrderCreated(event);
        } catch (Exception e) {
            log.error("Error processing order_created event: {}", message, e);
            // In production, consider sending to a dead letter queue
        }
    }

    @KafkaListener(topics = "${app.kafka.topics.payment-completed}", groupId = "${spring.kafka.consumer.group-id}")
    public void consumePaymentCompleted(String message) {
        try {
            log.debug("Received payment_completed event: {}", message);
            PaymentCompletedEvent event = objectMapper.readValue(message, PaymentCompletedEvent.class);
            eventProcessingService.processPaymentCompleted(event);
        } catch (Exception e) {
            log.error("Error processing payment_completed event: {}", message, e);
        }
    }

    @KafkaListener(topics = "${app.kafka.topics.product-viewed}", groupId = "${spring.kafka.consumer.group-id}")
    public void consumeProductViewed(String message) {
        try {
            log.debug("Received product_viewed event: {}", message);
            ProductViewedEvent event = objectMapper.readValue(message, ProductViewedEvent.class);
            eventProcessingService.processProductViewed(event);
        } catch (Exception e) {
            log.error("Error processing product_viewed event: {}", message, e);
        }
    }

    @KafkaListener(topics = "${app.kafka.topics.customer-registered}", groupId = "${spring.kafka.consumer.group-id}")
    public void consumeCustomerRegistered(String message) {
        try {
            log.debug("Received customer_registered event: {}", message);
            CustomerRegisteredEvent event = objectMapper.readValue(message, CustomerRegisteredEvent.class);
            eventProcessingService.processCustomerRegistered(event);
        } catch (Exception e) {
            log.error("Error processing customer_registered event: {}", message, e);
        }
    }
}

