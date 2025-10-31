package com.cloudshop.analyticsservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductViewedEvent {
    
    @JsonProperty("product_id")
    private String productId;
    
    @JsonProperty("user_id")
    private String userId;
    
    @JsonProperty("session_id")
    private String sessionId;
    
    @JsonProperty("category_id")
    private String categoryId;
    
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
}

