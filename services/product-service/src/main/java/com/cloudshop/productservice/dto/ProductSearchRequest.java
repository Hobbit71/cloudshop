package com.cloudshop.productservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSearchRequest {

    private String query;
    private UUID categoryId;
    private List<UUID> categoryIds;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Double minRating;
    private UUID merchantId;
    private Boolean isActive;
    private Integer page;
    private Integer size;
    private String sortBy;
    private String sortDirection;
}

