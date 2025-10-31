package com.cloudshop.customerservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "customer_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    private Customer customer;

    @Column(name = "language", length = 10)
    @Builder.Default
    private String language = "en";

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "USD";

    @Column(name = "timezone", length = 50)
    @Builder.Default
    private String timezone = "UTC";

    @Enumerated(EnumType.STRING)
    @Column(name = "email_communication", nullable = false, length = 20)
    @Builder.Default
    private CommunicationPreference emailCommunication = CommunicationPreference.OPTED_IN;

    @Enumerated(EnumType.STRING)
    @Column(name = "sms_communication", nullable = false, length = 20)
    @Builder.Default
    private CommunicationPreference smsCommunication = CommunicationPreference.OPTED_OUT;

    @Enumerated(EnumType.STRING)
    @Column(name = "push_communication", nullable = false, length = 20)
    @Builder.Default
    private CommunicationPreference pushCommunication = CommunicationPreference.OPTED_IN;

    @Column(name = "email_marketing", nullable = false)
    @Builder.Default
    private Boolean emailMarketing = true;

    @Column(name = "email_order_updates", nullable = false)
    @Builder.Default
    private Boolean emailOrderUpdates = true;

    @Column(name = "email_promotions", nullable = false)
    @Builder.Default
    private Boolean emailPromotions = true;

    @Column(name = "email_newsletter", nullable = false)
    @Builder.Default
    private Boolean emailNewsletter = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_preferences", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> customPreferences = new HashMap<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum CommunicationPreference {
        OPTED_IN, OPTED_OUT, REQUIRED
    }
}

