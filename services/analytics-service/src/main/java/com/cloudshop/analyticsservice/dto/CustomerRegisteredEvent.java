package com.cloudshop.analyticsservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerRegisteredEvent {
    
    @JsonProperty("customer_id")
    private String customerId;
    
    @JsonProperty("email")
    private String email;
    
    @JsonProperty("registration_source")
    private String registrationSource;
    
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
}

