package com.cloudshop.productservice.repository.elasticsearch;

import com.cloudshop.productservice.model.elasticsearch.ProductDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProductSearchRepository extends ElasticsearchRepository<ProductDocument, UUID> {

    Page<ProductDocument> findByNameContainingOrDescriptionContaining(
            String name, String description, Pageable pageable);

    Page<ProductDocument> findByCategoryId(UUID categoryId, Pageable pageable);

    Page<ProductDocument> findByMerchantId(UUID merchantId, Pageable pageable);

    Page<ProductDocument> findByIsActive(Boolean isActive, Pageable pageable);
}

