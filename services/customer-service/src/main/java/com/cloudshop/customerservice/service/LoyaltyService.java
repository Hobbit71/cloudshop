package com.cloudshop.customerservice.service;

import com.cloudshop.customerservice.dto.LoyaltyResponse;
import com.cloudshop.customerservice.exception.ResourceNotFoundException;
import com.cloudshop.customerservice.model.Customer;
import com.cloudshop.customerservice.model.LoyaltyProgram;
import com.cloudshop.customerservice.repository.CustomerRepository;
import com.cloudshop.customerservice.repository.LoyaltyProgramRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoyaltyService {

    private final LoyaltyProgramRepository loyaltyProgramRepository;
    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    @Transactional(readOnly = true)
    public LoyaltyResponse getLoyaltyProgram(UUID customerId) {
        LoyaltyProgram loyaltyProgram = loyaltyProgramRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Loyalty program not found for customer id: " + customerId));
        return customerMapper.toLoyaltyResponse(loyaltyProgram);
    }

    @Transactional
    @CacheEvict(value = "customer", key = "#customerId")
    public void addPoints(UUID customerId, Long points) {
        LoyaltyProgram loyaltyProgram = getOrCreateLoyaltyProgram(customerId);
        loyaltyProgram.addPoints(points);
        loyaltyProgramRepository.save(loyaltyProgram);
    }

    @Transactional
    @CacheEvict(value = "customer", key = "#customerId")
    public void spendPoints(UUID customerId, Long points) {
        LoyaltyProgram loyaltyProgram = loyaltyProgramRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Loyalty program not found for customer id: " + customerId));
        
        if (loyaltyProgram.getPoints() < points) {
            throw new IllegalArgumentException("Insufficient points. Available: " + loyaltyProgram.getPoints());
        }
        
        loyaltyProgram.spendPoints(points);
        loyaltyProgramRepository.save(loyaltyProgram);
    }

    @Transactional
    @CacheEvict(value = "customer", key = "#customerId")
    public void recordOrder(UUID customerId, BigDecimal orderTotal) {
        LoyaltyProgram loyaltyProgram = getOrCreateLoyaltyProgram(customerId);
        loyaltyProgram.addOrder(orderTotal);
        
        // Award points: 1 point per dollar spent (can be configured)
        Long pointsEarned = orderTotal.longValue();
        loyaltyProgram.addPoints(pointsEarned);
        
        loyaltyProgramRepository.save(loyaltyProgram);
    }

    private LoyaltyProgram getOrCreateLoyaltyProgram(UUID customerId) {
        return loyaltyProgramRepository.findByCustomerId(customerId)
                .orElseGet(() -> {
                    Customer customer = customerRepository.findById(customerId)
                            .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
                    LoyaltyProgram newProgram = LoyaltyProgram.builder()
                            .customer(customer)
                            .build();
                    return loyaltyProgramRepository.save(newProgram);
                });
    }
}

