package com.cloudshop.customerservice.dto;

import com.cloudshop.customerservice.model.Customer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponse {

    private UUID id;
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private Instant dateOfBirth;
    private Customer.CustomerStatus status;
    private Customer.LifecycleStage lifecycleStage;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLoginAt;
}

