package com.cloudshop.customerservice.repository.elasticsearch;

import com.cloudshop.customerservice.model.elasticsearch.CustomerDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CustomerSearchRepository extends ElasticsearchRepository<CustomerDocument, UUID> {

    Page<CustomerDocument> findByEmailContainingIgnoreCase(String email, Pageable pageable);

    Page<CustomerDocument> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName, String lastName, Pageable pageable);

    Page<CustomerDocument> findByStatus(String status, Pageable pageable);

    Page<CustomerDocument> findByLifecycleStage(String lifecycleStage, Pageable pageable);
}

