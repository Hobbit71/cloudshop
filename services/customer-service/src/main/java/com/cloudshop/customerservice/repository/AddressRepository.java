package com.cloudshop.customerservice.repository;

import com.cloudshop.customerservice.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AddressRepository extends JpaRepository<Address, UUID> {

    List<Address> findByCustomerId(UUID customerId);

    Optional<Address> findByCustomerIdAndIsDefault(UUID customerId, Boolean isDefault);

    Optional<Address> findByCustomerIdAndId(UUID customerId, UUID addressId);
}

