package com.cloudshop.customerservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "loyalty_programs", indexes = {
    @Index(name = "idx_loyalty_customer", columnList = "customer_id", unique = true),
    @Index(name = "idx_loyalty_tier", columnList = "tier"),
    @Index(name = "idx_loyalty_points", columnList = "points")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "tier", nullable = false, length = 20)
    @Builder.Default
    private LoyaltyTier tier = LoyaltyTier.BRONZE;

    @Column(name = "points", nullable = false)
    @Builder.Default
    private Long points = 0L;

    @Column(name = "lifetime_points", nullable = false)
    @Builder.Default
    private Long lifetimePoints = 0L;

    @Column(name = "total_spent", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Column(name = "orders_count", nullable = false)
    @Builder.Default
    private Integer ordersCount = 0;

    @Column(name = "next_tier_points")
    private Long nextTierPoints;

    @Column(name = "points_expiring_soon")
    @Builder.Default
    private Long pointsExpiringSoon = 0L;

    @Column(name = "last_points_earned_at")
    private Instant lastPointsEarnedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public void addPoints(Long points) {
        this.points += points;
        this.lifetimePoints += points;
        this.lastPointsEarnedAt = Instant.now();
        updateTier();
    }

    public void spendPoints(Long points) {
        if (this.points >= points) {
            this.points -= points;
        }
    }

    public void addOrder(BigDecimal orderTotal) {
        this.ordersCount++;
        this.totalSpent = this.totalSpent.add(orderTotal);
        updateTier();
    }

    private void updateTier() {
        if (totalSpent.compareTo(new BigDecimal("5000")) >= 0) {
            this.tier = LoyaltyTier.PLATINUM;
            this.nextTierPoints = null;
        } else if (totalSpent.compareTo(new BigDecimal("2000")) >= 0) {
            this.tier = LoyaltyTier.GOLD;
            this.nextTierPoints = 5000L;
        } else if (totalSpent.compareTo(new BigDecimal("500")) >= 0) {
            this.tier = LoyaltyTier.SILVER;
            this.nextTierPoints = 2000L;
        } else {
            this.tier = LoyaltyTier.BRONZE;
            this.nextTierPoints = 500L;
        }
    }

    public enum LoyaltyTier {
        BRONZE, SILVER, GOLD, PLATINUM
    }
}

