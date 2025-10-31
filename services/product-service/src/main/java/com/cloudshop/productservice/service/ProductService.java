package com.cloudshop.productservice.service;

import com.cloudshop.productservice.dto.*;
import com.cloudshop.productservice.exception.ResourceNotFoundException;
import com.cloudshop.productservice.model.Product;
import com.cloudshop.productservice.model.ProductVariant;
import com.cloudshop.productservice.repository.ProductRepository;
import com.cloudshop.productservice.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final ProductMapper productMapper;
    private final ValidationService validationService;
    private final SearchService searchService;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getAllProducts(int page, int size, String sortBy, String sortDirection) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection != null ? sortDirection : "ASC"),
                sortBy != null ? sortBy : "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Product> productPage = productRepository.findByIsActive(true, pageable);
        return mapToPageResponse(productPage);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "product", key = "#id")
    public ProductResponse getProductById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        Double averageRating = reviewRepository.findAverageRatingByProductId(id);
        Long reviewCount = reviewRepository.countByProductId(id);

        return productMapper.toProductResponseWithStats(product, averageRating, reviewCount);
    }

    @Transactional
    @CacheEvict(value = {"product", "products"}, allEntries = true)
    public ProductResponse createProduct(ProductRequest request, UUID merchantId) {
        validationService.validateProductRequest(request);

        if (productRepository.existsBySku(request.getSku())) {
            throw new IllegalArgumentException("Product with SKU " + request.getSku() + " already exists");
        }

        Product product = productMapper.toProduct(request);
        product.setMerchantId(merchantId);

        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            for (ProductVariantRequest variantRequest : request.getVariants()) {
                ProductVariant variant = productMapper.toProductVariant(variantRequest);
                product.addVariant(variant);
            }
        }

        Product savedProduct = productRepository.save(product);

        // Index in Elasticsearch
        searchService.indexProduct(savedProduct);

        return productMapper.toProductResponse(savedProduct);
    }

    @Transactional
    @CacheEvict(value = {"product", "products"}, allEntries = true)
    public ProductResponse updateProduct(UUID id, ProductRequest request, UUID merchantId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (!product.getMerchantId().equals(merchantId)) {
            throw new IllegalArgumentException("You don't have permission to update this product");
        }

        validationService.validateProductRequest(request);

        // Check SKU uniqueness if changed
        if (!product.getSku().equals(request.getSku()) && productRepository.existsBySku(request.getSku())) {
            throw new IllegalArgumentException("Product with SKU " + request.getSku() + " already exists");
        }

        // Update basic fields
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setSku(request.getSku());
        product.setPrice(request.getPrice());
        product.setCategoryId(request.getCategoryId());
        product.setImageUrl(request.getImageUrl());
        if (request.getImageUrls() != null) {
            product.setImageUrls(new ArrayList<>(request.getImageUrls()));
        }

        // Update variants
        if (request.getVariants() != null) {
            product.getVariants().clear();
            for (ProductVariantRequest variantRequest : request.getVariants()) {
                ProductVariant variant = productMapper.toProductVariant(variantRequest);
                product.addVariant(variant);
            }
        }

        Product updatedProduct = productRepository.save(product);

        // Update in Elasticsearch
        searchService.indexProduct(updatedProduct);

        return productMapper.toProductResponse(updatedProduct);
    }

    @Transactional
    @CacheEvict(value = {"product", "products"}, allEntries = true)
    public void deleteProduct(UUID id, UUID merchantId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (!product.getMerchantId().equals(merchantId)) {
            throw new IllegalArgumentException("You don't have permission to delete this product");
        }

        // Soft delete
        product.setIsActive(false);
        productRepository.save(product);

        // Remove from Elasticsearch
        searchService.removeProduct(id);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> searchProducts(ProductSearchRequest searchRequest) {
        int page = searchRequest.getPage() != null ? searchRequest.getPage() : 0;
        int size = searchRequest.getSize() != null ? searchRequest.getSize() : 20;
        String sortBy = searchRequest.getSortBy() != null ? searchRequest.getSortBy() : "createdAt";
        String sortDirection = searchRequest.getSortDirection() != null ? searchRequest.getSortDirection() : "DESC";

        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Product> productPage;

        // Try Elasticsearch first if query is provided
        if (searchRequest.getQuery() != null && !searchRequest.getQuery().trim().isEmpty()) {
            try {
                return searchService.searchProducts(searchRequest, pageable);
            } catch (Exception e) {
                log.warn("Elasticsearch search failed, falling back to database search", e);
            }
        }

        // Fallback to database search
        productPage = productRepository.searchProductsWithFilters(
                searchRequest.getQuery(),
                searchRequest.getCategoryId(),
                searchRequest.getMinPrice(),
                searchRequest.getMaxPrice(),
                searchRequest.getMerchantId(),
                searchRequest.getIsActive() != null ? searchRequest.getIsActive() : true,
                pageable
        );

        return mapToPageResponse(productPage);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProductsByCategory(UUID categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productRepository.findByCategoryId(categoryId, pageable);
        return mapToPageResponse(productPage);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProductsByMerchant(UUID merchantId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productRepository.findByMerchantIdAndIsActive(merchantId, true, pageable);
        return mapToPageResponse(productPage);
    }

    private PageResponse<ProductResponse> mapToPageResponse(Page<Product> productPage) {
        List<ProductResponse> productResponses = productPage.getContent().stream()
                .map(product -> {
                    Double averageRating = reviewRepository.findAverageRatingByProductId(product.getId());
                    Long reviewCount = reviewRepository.countByProductId(product.getId());
                    return productMapper.toProductResponseWithStats(product, averageRating, reviewCount);
                })
                .toList();

        return PageResponse.<ProductResponse>builder()
                .content(productResponses)
                .page(productPage.getNumber())
                .size(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .first(productPage.isFirst())
                .last(productPage.isLast())
                .build();
    }
}

