package com.cloudshop.productservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {

    private UUID id;
    private String sku;
    private String name;
    private String size;
    private String color;
    private BigDecimal priceAdjustment;
    private Integer stockQuantity;
    private Boolean isAvailable;
    private Instant createdAt;
    private Instant updatedAt;
}

