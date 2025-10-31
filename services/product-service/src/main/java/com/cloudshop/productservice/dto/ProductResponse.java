package com.cloudshop.productservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private UUID id;
    private UUID merchantId;
    private String name;
    private String description;
    private String sku;
    private BigDecimal price;
    private UUID categoryId;
    private CategoryResponse category;
    private String imageUrl;
    private List<String> imageUrls;
    private List<ProductVariantResponse> variants;
    private List<ReviewResponse> reviews;
    private BigDecimal averageRating;
    private Integer reviewCount;
    private Instant createdAt;
    private Instant updatedAt;
    private Boolean isActive;
}

