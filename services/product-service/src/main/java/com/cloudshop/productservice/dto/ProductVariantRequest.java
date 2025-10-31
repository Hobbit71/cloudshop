package com.cloudshop.productservice.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantRequest {

    @NotBlank(message = "Variant SKU is required")
    @Size(max = 100, message = "Variant SKU must not exceed 100 characters")
    private String sku;

    @NotBlank(message = "Variant name is required")
    @Size(max = 255, message = "Variant name must not exceed 255 characters")
    private String name;

    @Size(max = 50, message = "Size must not exceed 50 characters")
    private String size;

    @Size(max = 50, message = "Color must not exceed 50 characters")
    private String color;

    @Digits(integer = 10, fraction = 2, message = "Price adjustment must have at most 10 integer digits and 2 decimal places")
    private BigDecimal priceAdjustment;

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity must be non-negative")
    private Integer stockQuantity;

    @Builder.Default
    private Boolean isAvailable = true;
}

