package com.cloudshop.customerservice.dto;

import com.cloudshop.customerservice.model.CustomerPreferences;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreferencesResponse {

    private UUID id;
    private String language;
    private String currency;
    private String timezone;
    private CustomerPreferences.CommunicationPreference emailCommunication;
    private CustomerPreferences.CommunicationPreference smsCommunication;
    private CustomerPreferences.CommunicationPreference pushCommunication;
    private Boolean emailMarketing;
    private Boolean emailOrderUpdates;
    private Boolean emailPromotions;
    private Boolean emailNewsletter;
    private Map<String, Object> customPreferences;
    private Instant createdAt;
    private Instant updatedAt;
}

