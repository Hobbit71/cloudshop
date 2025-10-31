package com.cloudshop.analyticsservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCompletedEvent {
    
    @JsonProperty("payment_id")
    private String paymentId;
    
    @JsonProperty("order_id")
    private String orderId;
    
    @JsonProperty("customer_id")
    private String customerId;
    
    @JsonProperty("amount")
    private BigDecimal amount;
    
    @JsonProperty("currency")
    private String currency;
    
    @JsonProperty("payment_method")
    private String paymentMethod;
    
    @JsonProperty("payment_gateway")
    private String paymentGateway;
    
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
}

