package com.cloudshop.analyticsservice.repository.elasticsearch;

import com.cloudshop.analyticsservice.model.elasticsearch.EventDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventDocumentRepository extends ElasticsearchRepository<EventDocument, String> {
    
    List<EventDocument> findByEventType(String eventType);
    
    List<EventDocument> findByUserId(String userId);
    
    List<EventDocument> findByTimestampBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    List<EventDocument> findByEventTypeAndTimestampBetween(String eventType, LocalDateTime startTime, LocalDateTime endTime);
}

