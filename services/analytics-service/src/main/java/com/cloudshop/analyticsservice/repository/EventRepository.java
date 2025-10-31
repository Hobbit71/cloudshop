package com.cloudshop.analyticsservice.repository;

import com.cloudshop.analyticsservice.model.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    
    Page<Event> findByEventType(String eventType, Pageable pageable);
    
    Page<Event> findByUserId(String userId, Pageable pageable);
    
    List<Event> findByProcessedFalse();
    
    @Query("SELECT e FROM Event e WHERE e.timestamp BETWEEN :startTime AND :endTime")
    List<Event> findByTimestampBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    @Query("SELECT e FROM Event e WHERE e.eventType = :eventType AND e.timestamp BETWEEN :startTime AND :endTime")
    List<Event> findByEventTypeAndTimestampBetween(String eventType, LocalDateTime startTime, LocalDateTime endTime);
}

