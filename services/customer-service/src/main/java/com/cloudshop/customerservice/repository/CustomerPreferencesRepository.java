package com.cloudshop.customerservice.repository;

import com.cloudshop.customerservice.model.CustomerPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerPreferencesRepository extends JpaRepository<CustomerPreferences, UUID> {

    Optional<CustomerPreferences> findByCustomerId(UUID customerId);
}

