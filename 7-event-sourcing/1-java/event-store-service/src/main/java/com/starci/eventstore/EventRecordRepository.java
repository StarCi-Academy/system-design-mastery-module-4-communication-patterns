package com.starci.eventstore;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

/**
 * EventRecordRepository — Spring Data JPA repository for the {@code events} table.
 */
public interface EventRecordRepository extends JpaRepository<EventRecord, Long> {

    /** Load all events for an aggregate, ordered by version ASC (for replay). */
    List<EventRecord> findByAggregateIdOrderByVersionAsc(String aggregateId);

    /** Distinct aggregate IDs for a given aggregate type (used by rebuild-all). */
    @Query("SELECT DISTINCT e.aggregateId FROM EventRecord e WHERE e.aggregateType = :aggregateType")
    List<String> findDistinctAggregateIdsByType(String aggregateType);
}
