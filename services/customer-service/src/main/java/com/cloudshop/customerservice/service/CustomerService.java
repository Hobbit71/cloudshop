package com.cloudshop.customerservice.service;

import com.cloudshop.customerservice.dto.*;
import com.cloudshop.customerservice.exception.ResourceNotFoundException;
import com.cloudshop.customerservice.model.*;
import com.cloudshop.customerservice.model.elasticsearch.CustomerDocument;
import com.cloudshop.customerservice.repository.*;
import com.cloudshop.customerservice.repository.elasticsearch.CustomerSearchRepository;
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

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerPreferencesRepository preferencesRepository;
    private final LoyaltyProgramRepository loyaltyProgramRepository;
    private final CustomerSearchRepository customerSearchRepository;
    private final CustomerMapper customerMapper;

    @Transactional(readOnly = true)
    @Cacheable(value = "customer", key = "#id")
    public CustomerResponse getCustomerById(UUID id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return customerMapper.toCustomerResponse(customer);
    }

    @Transactional
    @CacheEvict(value = {"customer", "customers"}, allEntries = true)
    public CustomerResponse updateCustomer(UUID id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        // Check email uniqueness if changed
        if (!customer.getEmail().equals(request.getEmail()) && 
            customerRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Customer with email " + request.getEmail() + " already exists");
        }

        customerMapper.updateCustomerFromRequest(request, customer);
        Customer updatedCustomer = customerRepository.save(customer);

        // Update in Elasticsearch
        indexCustomer(updatedCustomer);

        return customerMapper.toCustomerResponse(updatedCustomer);
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomerByUserId(UUID userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with user id: " + userId));
        return customerMapper.toCustomerResponse(customer);
    }

    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        // Check if customer already exists with this userId or email
        if (customerRepository.findByUserId(request.getUserId()).isPresent()) {
            throw new IllegalArgumentException("Customer with user ID " + request.getUserId() + " already exists");
        }
        if (customerRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Customer with email " + request.getEmail() + " already exists");
        }

        Customer customer = customerMapper.toCustomer(request);
        customer.setStatus(Customer.CustomerStatus.ACTIVE);
        customer.setLifecycleStage(Customer.LifecycleStage.NEW);

        Customer savedCustomer = customerRepository.save(customer);

        // Create default preferences
        CustomerPreferences preferences = CustomerPreferences.builder()
                .customer(savedCustomer)
                .build();
        preferencesRepository.save(preferences);

        // Create loyalty program
        LoyaltyProgram loyaltyProgram = LoyaltyProgram.builder()
                .customer(savedCustomer)
                .build();
        loyaltyProgramRepository.save(loyaltyProgram);

        // Index in Elasticsearch
        indexCustomer(savedCustomer);

        return customerMapper.toCustomerResponse(savedCustomer);
    }

    @Transactional
    public void updateCustomerLifecycle(UUID customerId, Customer.LifecycleStage stage) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
        customer.setLifecycleStage(stage);
        customerRepository.save(customer);
        indexCustomer(customer);
    }

    @Transactional
    public void recordLogin(UUID customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
        customer.setLastLoginAt(java.time.Instant.now());
        
        // Update lifecycle stage based on activity
        if (customer.getLifecycleStage() == Customer.LifecycleStage.AT_RISK) {
            customer.setLifecycleStage(Customer.LifecycleStage.ACTIVE);
        }
        
        customerRepository.save(customer);
    }

    private void indexCustomer(Customer customer) {
        try {
            CustomerDocument document = customerMapper.toCustomerDocument(customer);
            customerSearchRepository.save(document);
        } catch (Exception e) {
            log.warn("Failed to index customer in Elasticsearch", e);
        }
    }
}

