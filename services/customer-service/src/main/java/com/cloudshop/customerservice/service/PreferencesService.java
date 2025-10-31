package com.cloudshop.customerservice.service;

import com.cloudshop.customerservice.dto.*;
import com.cloudshop.customerservice.exception.ResourceNotFoundException;
import com.cloudshop.customerservice.model.Customer;
import com.cloudshop.customerservice.model.CustomerPreferences;
import com.cloudshop.customerservice.repository.CustomerPreferencesRepository;
import com.cloudshop.customerservice.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PreferencesService {

    private final CustomerPreferencesRepository preferencesRepository;
    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    @Transactional(readOnly = true)
    public PreferencesResponse getPreferences(UUID customerId) {
        CustomerPreferences preferences = preferencesRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Preferences not found for customer id: " + customerId));
        return customerMapper.toPreferencesResponse(preferences);
    }

    @Transactional
    @CacheEvict(value = "customer", key = "#customerId")
    public PreferencesResponse updatePreferences(UUID customerId, PreferencesRequest request) {
        CustomerPreferences preferences = preferencesRepository.findByCustomerId(customerId)
                .orElseGet(() -> {
                    Customer customer = customerRepository.findById(customerId)
                            .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
                    CustomerPreferences newPreferences = CustomerPreferences.builder()
                            .customer(customer)
                            .build();
                    return preferencesRepository.save(newPreferences);
                });

        customerMapper.updatePreferencesFromRequest(request, preferences);
        CustomerPreferences updatedPreferences = preferencesRepository.save(preferences);
        return customerMapper.toPreferencesResponse(updatedPreferences);
    }
}

