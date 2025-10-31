package com.cloudshop.customerservice.dto;

import com.cloudshop.customerservice.model.CustomerPreferences;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreferencesRequest {

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
}

