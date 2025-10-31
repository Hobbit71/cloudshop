package com.cloudshop.customerservice.service;

import com.cloudshop.customerservice.dto.*;
import com.cloudshop.customerservice.exception.ResourceNotFoundException;
import com.cloudshop.customerservice.model.Address;
import com.cloudshop.customerservice.model.Customer;
import com.cloudshop.customerservice.repository.AddressRepository;
import com.cloudshop.customerservice.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AddressService {

    private final AddressRepository addressRepository;
    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    @Transactional
    @CacheEvict(value = "customer", key = "#customerId")
    public AddressResponse createAddress(UUID customerId, AddressRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        Address address = customerMapper.toAddress(request);
        
        // If this is set as default, unset other default addresses
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.findByCustomerIdAndIsDefault(customerId, true)
                    .ifPresent(defaultAddress -> {
                        defaultAddress.setIsDefault(false);
                        addressRepository.save(defaultAddress);
                    });
        }

        customer.addAddress(address);
        Address savedAddress = addressRepository.save(address);
        return customerMapper.toAddressResponse(savedAddress);
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getAddressesByCustomerId(UUID customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer not found with id: " + customerId);
        }

        List<Address> addresses = addressRepository.findByCustomerId(customerId);
        return customerMapper.toAddressResponseList(addresses);
    }

    @Transactional
    @CacheEvict(value = "customer", key = "#customerId")
    public AddressResponse updateAddress(UUID customerId, UUID addressId, AddressRequest request) {
        Address address = addressRepository.findByCustomerIdAndId(customerId, addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));

        // If setting as default, unset other defaults
        if (Boolean.TRUE.equals(request.getIsDefault()) && !address.getIsDefault()) {
            addressRepository.findByCustomerIdAndIsDefault(customerId, true)
                    .ifPresent(defaultAddress -> {
                        defaultAddress.setIsDefault(false);
                        addressRepository.save(defaultAddress);
                    });
        }

        customerMapper.updateAddressFromRequest(request, address);
        Address updatedAddress = addressRepository.save(address);
        return customerMapper.toAddressResponse(updatedAddress);
    }

    @Transactional
    @CacheEvict(value = "customer", key = "#customerId")
    public void deleteAddress(UUID customerId, UUID addressId) {
        Address address = addressRepository.findByCustomerIdAndId(customerId, addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));
        addressRepository.delete(address);
    }
}

