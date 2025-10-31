package com.cloudshop.productservice.service;

import com.cloudshop.productservice.dto.PageResponse;
import com.cloudshop.productservice.dto.ProductResponse;
import com.cloudshop.productservice.dto.ProductSearchRequest;
import com.cloudshop.productservice.model.Product;
import com.cloudshop.productservice.model.elasticsearch.ProductDocument;
import com.cloudshop.productservice.repository.elasticsearch.ProductSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {

    private final ProductSearchRepository productSearchRepository;
    private final ElasticsearchOperations elasticsearchOperations;
    private final ProductMapper productMapper;

    @Transactional
    public void indexProduct(Product product) {
        try {
            ProductDocument document = toProductDocument(product);
            productSearchRepository.save(document);
            log.debug("Indexed product: {}", product.getId());
        } catch (Exception e) {
            log.error("Failed to index product: {}", product.getId(), e);
            // Don't throw - search is not critical
        }
    }

    @Transactional
    public void removeProduct(UUID productId) {
        try {
            productSearchRepository.deleteById(productId);
            log.debug("Removed product from index: {}", productId);
        } catch (Exception e) {
            log.error("Failed to remove product from index: {}", productId, e);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> searchProducts(ProductSearchRequest searchRequest, Pageable pageable) {
        Criteria criteria = new Criteria();

        // Text search
        if (searchRequest.getQuery() != null && !searchRequest.getQuery().trim().isEmpty()) {
            criteria = criteria.and(
                    new Criteria("name").contains(searchRequest.getQuery())
                            .or(new Criteria("description").contains(searchRequest.getQuery()))
                            .or(new Criteria("sku").is(searchRequest.getQuery()))
            );
        }

        // Filters
        if (searchRequest.getCategoryId() != null) {
            criteria = criteria.and(new Criteria("categoryId").is(searchRequest.getCategoryId()));
        }

        if (searchRequest.getMinPrice() != null) {
            criteria = criteria.and(new Criteria("price").greaterThanEqual(searchRequest.getMinPrice().doubleValue()));
        }

        if (searchRequest.getMaxPrice() != null) {
            criteria = criteria.and(new Criteria("price").lessThanEqual(searchRequest.getMaxPrice().doubleValue()));
        }

        if (searchRequest.getMerchantId() != null) {
            criteria = criteria.and(new Criteria("merchantId").is(searchRequest.getMerchantId()));
        }

        if (searchRequest.getIsActive() != null) {
            criteria = criteria.and(new Criteria("isActive").is(searchRequest.getIsActive()));
        }

        if (searchRequest.getMinRating() != null) {
            criteria = criteria.and(new Criteria("averageRating").greaterThanEqual(searchRequest.getMinRating()));
        }

        CriteriaQuery query = new CriteriaQuery(criteria).setPageable(pageable);

        SearchHits<ProductDocument> searchHits = elasticsearchOperations.search(query, ProductDocument.class);

        List<ProductResponse> products = searchHits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .map(this::toProductResponse)
                .collect(Collectors.toList());

        return PageResponse.<ProductResponse>builder()
                .content(products)
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .totalElements(searchHits.getTotalHits())
                .totalPages((int) Math.ceil((double) searchHits.getTotalHits() / pageable.getPageSize()))
                .first(pageable.getPageNumber() == 0)
                .last(pageable.getPageNumber() >= (int) Math.ceil((double) searchHits.getTotalHits() / pageable.getPageSize()) - 1)
                .build();
    }

    private ProductDocument toProductDocument(Product product) {
        // Calculate average rating and review count
        // Note: In a real implementation, you might want to fetch these from the database
        // or maintain them in the product entity

        return ProductDocument.builder()
                .id(product.getId())
                .merchantId(product.getMerchantId())
                .name(product.getName())
                .description(product.getDescription())
                .sku(product.getSku())
                .price(product.getPrice())
                .categoryId(product.getCategoryId())
                .imageUrl(product.getImageUrl())
                .imageUrls(product.getImageUrls())
                .isActive(product.getIsActive())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private ProductResponse toProductResponse(ProductDocument document) {
        // Convert document back to response
        // In a real implementation, you might want to fetch the full product from database
        // or store more fields in the document
        return ProductResponse.builder()
                .id(document.getId())
                .merchantId(document.getMerchantId())
                .name(document.getName())
                .description(document.getDescription())
                .sku(document.getSku())
                .price(document.getPrice())
                .categoryId(document.getCategoryId())
                .imageUrl(document.getImageUrl())
                .imageUrls(document.getImageUrls())
                .isActive(document.getIsActive())
                .averageRating(document.getAverageRating() != null ? 
                        java.math.BigDecimal.valueOf(document.getAverageRating()) : null)
                .reviewCount(document.getReviewCount())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }
}

