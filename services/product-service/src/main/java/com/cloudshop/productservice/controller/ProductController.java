package com.cloudshop.productservice.controller;

import com.cloudshop.productservice.dto.*;
import com.cloudshop.productservice.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final BulkImportService bulkImportService;
    private final ImageService imageService;

    @GetMapping
    public ResponseEntity<PageResponse<ProductResponse>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "DESC") String sortDirection) {
        
        PageResponse<ProductResponse> response = productService.getAllProducts(page, size, sortBy, sortDirection);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable UUID id) {
        ProductResponse response = productService.getProductById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody ProductRequest request,
            @RequestHeader("X-Merchant-Id") UUID merchantId) {
        
        ProductResponse response = productService.createProduct(request, merchantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody ProductRequest request,
            @RequestHeader("X-Merchant-Id") UUID merchantId) {
        
        ProductResponse response = productService.updateProduct(id, request, merchantId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable UUID id,
            @RequestHeader("X-Merchant-Id") UUID merchantId) {
        
        productService.deleteProduct(id, merchantId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<ProductResponse>> searchProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) UUID merchantId,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "DESC") String sortDirection) {
        
        ProductSearchRequest searchRequest = ProductSearchRequest.builder()
                .query(query)
                .categoryId(categoryId)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .minRating(minRating)
                .merchantId(merchantId)
                .isActive(isActive)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();
        
        PageResponse<ProductResponse> response = productService.searchProducts(searchRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<PageResponse<ProductResponse>> getProductsByCategory(
            @PathVariable UUID categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        PageResponse<ProductResponse> response = productService.getProductsByCategory(categoryId, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/merchant/{merchantId}")
    public ResponseEntity<PageResponse<ProductResponse>> getProductsByMerchant(
            @PathVariable UUID merchantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        PageResponse<ProductResponse> response = productService.getProductsByMerchant(merchantId, page, size);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bulk-import")
    public ResponseEntity<BulkImportResponse> bulkImportProducts(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-Merchant-Id") UUID merchantId) {
        
        BulkImportResponse response = bulkImportService.importProducts(file, merchantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/images")
    public ResponseEntity<ProductResponse> uploadProductImages(
            @PathVariable UUID id,
            @RequestParam("files") MultipartFile[] files,
            @RequestHeader("X-Merchant-Id") UUID merchantId) {
        
        // Upload images and update product
        java.util.List<String> imageUrls = imageService.uploadImages(java.util.Arrays.asList(files), id);
        
        // Get product and update with new image URLs
        ProductResponse product = productService.getProductById(id);
        ProductRequest updateRequest = ProductRequest.builder()
                .name(product.getName())
                .description(product.getDescription())
                .sku(product.getSku())
                .price(product.getPrice())
                .categoryId(product.getCategoryId())
                .imageUrl(product.getImageUrl())
                .imageUrls(imageUrls)
                .build();
        
        ProductResponse response = productService.updateProduct(id, updateRequest, merchantId);
        return ResponseEntity.ok(response);
    }
}

