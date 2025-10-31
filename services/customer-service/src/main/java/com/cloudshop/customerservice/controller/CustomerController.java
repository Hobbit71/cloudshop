package com.cloudshop.customerservice.controller;

import com.cloudshop.customerservice.dto.*;
import com.cloudshop.customerservice.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
@Slf4j
public class CustomerController {

    private final CustomerService customerService;
    private final AddressService addressService;
    private final PreferencesService preferencesService;
    private final LoyaltyService loyaltyService;

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> getCustomer(@PathVariable UUID id) {
        CustomerResponse response = customerService.getCustomerById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable UUID id,
            @Valid @RequestBody CustomerRequest request) {
        
        CustomerResponse response = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/addresses")
    public ResponseEntity<AddressResponse> createAddress(
            @PathVariable UUID id,
            @Valid @RequestBody AddressRequest request) {
        
        AddressResponse response = addressService.createAddress(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/addresses")
    public ResponseEntity<List<AddressResponse>> getAddresses(@PathVariable UUID id) {
        List<AddressResponse> response = addressService.getAddressesByCustomerId(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/orders")
    public ResponseEntity<List<Object>> getCustomerOrders(@PathVariable UUID id) {
        // TODO: Integrate with order-service to fetch customer orders
        // The order-service exposes: GET /api/v1/orders?customer_id={id}
        // This would require adding an OrderServiceClient to call the order-service REST API
        log.info("Fetching orders for customer: {}", id);
        log.warn("Orders endpoint not yet integrated with order-service");
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}/preferences")
    public ResponseEntity<PreferencesResponse> getPreferences(@PathVariable UUID id) {
        PreferencesResponse response = preferencesService.getPreferences(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/preferences")
    public ResponseEntity<PreferencesResponse> updatePreferences(
            @PathVariable UUID id,
            @Valid @RequestBody PreferencesRequest request) {
        
        PreferencesResponse response = preferencesService.updatePreferences(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/loyalty")
    public ResponseEntity<LoyaltyResponse> getLoyaltyProgram(@PathVariable UUID id) {
        LoyaltyResponse response = loyaltyService.getLoyaltyProgram(id);
        return ResponseEntity.ok(response);
    }
}

