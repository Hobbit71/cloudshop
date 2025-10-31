package com.cloudshop.customerservice.dto;

import com.cloudshop.customerservice.model.LoyaltyProgram;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyResponse {

    private UUID id;
    private LoyaltyProgram.LoyaltyTier tier;
    private Long points;
    private Long lifetimePoints;
    private BigDecimal totalSpent;
    private Integer ordersCount;
    private Long nextTierPoints;
    private Long pointsExpiringSoon;
    private Instant lastPointsEarnedAt;
    private Instant createdAt;
    private Instant updatedAt;
}

