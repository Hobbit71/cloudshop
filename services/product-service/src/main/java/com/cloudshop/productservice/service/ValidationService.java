package com.cloudshop.productservice.service;

import com.cloudshop.productservice.dto.ProductRequest;
import com.cloudshop.productservice.dto.ProductVariantRequest;
import com.cloudshop.productservice.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ValidationService {

    private final CategoryRepository categoryRepository;

    public void validateProductRequest(ProductRequest request) {
        // Validate category exists if provided
        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + request.getCategoryId()));
        }

        // Validate variants
        if (request.getVariants() != null) {
            for (ProductVariantRequest variant : request.getVariants()) {
                validateVariantRequest(variant);
            }
        }
    }

    public void validateVariantRequest(ProductVariantRequest request) {
        if (request.getSku() == null || request.getSku().trim().isEmpty()) {
            throw new IllegalArgumentException("Variant SKU is required");
        }

        if (request.getStockQuantity() != null && request.getStockQuantity() < 0) {
            throw new IllegalArgumentException("Stock quantity cannot be negative");
        }
    }
}

