package com.starci.eventstore;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.Map;

/**
 * EventRecord — one row in the {@code events} table (append-only event log).
 *
 * <p>Each row is an immutable domain event. NEVER update or delete rows.
 * The composite unique constraint (aggregate_id, version) prevents
 * concurrent-write conflicts.
 */
@Entity
@Table(
    name = "events",
    uniqueConstraints = @UniqueConstraint(columnNames = {"aggregate_id", "version"})
)
public class EventRecord {

    /** Auto-increment PK — used only as a pagination cursor. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Aggregate ID (e.g., accountId). */
    @Column(name = "aggregate_id", nullable = false, length = 100)
    private String aggregateId;

    /** Aggregate type (e.g., "Account"). */
    @Column(name = "aggregate_type", nullable = false, length = 100)
    private String aggregateType;

    /**
     * Monotonic version within the aggregate — starts at 1.
     * Unique together with aggregateId to detect concurrent-write conflicts.
     */
    @Column(nullable = false)
    private int version;

    /** Event name (e.g., "AccountOpened", "MoneyDeposited"). */
    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    /** JSON payload — immutable business data stored as JSONB. */
    @Type(JsonType.class)
    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> payload;

    /** Timestamp set by DB on insert — cannot be overridden. */
    @CreationTimestamp
    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    // ─── Constructors ────────────────────────────────────────────────────────

    public EventRecord() {}

    public EventRecord(String aggregateId, String aggregateType, int version,
                       String eventType, Map<String, Object> payload) {
        this.aggregateId = aggregateId;
        this.aggregateType = aggregateType;
        this.version = version;
        this.eventType = eventType;
        this.payload = payload;
    }

    // ─── Getters ─────────────────────────────────────────────────────────────

    public Long getId() { return id; }
    public String getAggregateId() { return aggregateId; }
    public String getAggregateType() { return aggregateType; }
    public int getVersion() { return version; }
    public String getEventType() { return eventType; }
    public Map<String, Object> getPayload() { return payload; }
    public Instant getOccurredAt() { return occurredAt; }
}
