package com.cloudshop.customerservice.service;

import com.cloudshop.customerservice.dto.*;
import com.cloudshop.customerservice.model.*;
import com.cloudshop.customerservice.model.elasticsearch.CustomerDocument;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface CustomerMapper {

    CustomerResponse toCustomerResponse(Customer customer);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", source = "request.userId")
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "lifecycleStage", ignore = true)
    @Mapping(target = "addresses", ignore = true)
    @Mapping(target = "preferences", ignore = true)
    @Mapping(target = "loyaltyProgram", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "lastLoginAt", ignore = true)
    Customer toCustomer(CustomerRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "addresses", ignore = true)
    @Mapping(target = "preferences", ignore = true)
    @Mapping(target = "loyaltyProgram", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateCustomerFromRequest(CustomerRequest request, @MappingTarget Customer customer);

    AddressResponse toAddressResponse(Address address);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Address toAddress(AddressRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateAddressFromRequest(AddressRequest request, @MappingTarget Address address);

    PreferencesResponse toPreferencesResponse(CustomerPreferences preferences);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    CustomerPreferences toPreferences(PreferencesRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updatePreferencesFromRequest(PreferencesRequest request, @MappingTarget CustomerPreferences preferences);

    LoyaltyResponse toLoyaltyResponse(LoyaltyProgram loyaltyProgram);

    default CustomerDocument toCustomerDocument(Customer customer) {
        if (customer == null) {
            return null;
        }
        CustomerDocument document = new CustomerDocument();
        document.setId(customer.getId());
        document.setUserId(customer.getUserId());
        document.setEmail(customer.getEmail());
        document.setFirstName(customer.getFirstName());
        document.setLastName(customer.getLastName());
        document.setPhone(customer.getPhone());
        document.setStatus(customer.getStatus() != null ? customer.getStatus().name() : null);
        document.setLifecycleStage(customer.getLifecycleStage() != null ? customer.getLifecycleStage().name() : null);
        document.setCreatedAt(customer.getCreatedAt());
        document.setLastLoginAt(customer.getLastLoginAt());
        
        // Build search text
        String searchText = String.format("%s %s %s",
            customer.getFirstName() != null ? customer.getFirstName() : "",
            customer.getLastName() != null ? customer.getLastName() : "",
            customer.getEmail() != null ? customer.getEmail() : ""
        ).trim();
        document.setSearchText(searchText);
        
        return document;
    }

    List<AddressResponse> toAddressResponseList(List<Address> addresses);
}

