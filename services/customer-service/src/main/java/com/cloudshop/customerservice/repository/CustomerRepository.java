package com.cloudshop.customerservice.repository;

import com.cloudshop.customerservice.model.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Optional<Customer> findByUserId(UUID userId);

    Optional<Customer> findByEmail(String email);

    Page<Customer> findByStatus(Customer.CustomerStatus status, Pageable pageable);

    Page<Customer> findByLifecycleStage(Customer.LifecycleStage lifecycleStage, Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:lifecycleStage IS NULL OR c.lifecycleStage = :lifecycleStage)")
    Page<Customer> findByFilters(
            @Param("status") Customer.CustomerStatus status,
            @Param("lifecycleStage") Customer.LifecycleStage lifecycleStage,
            Pageable pageable
    );
}

