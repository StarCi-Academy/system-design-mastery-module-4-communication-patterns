package com.starci.eventstore;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.Map;

/**
 * AccountSnapshot — snapshot of account state at a specific version.
 *
 * <p>Optimises replay: instead of replaying the full event log, load the
 * latest snapshot and replay only events after its version.
 */
@Entity
@Table(
    name = "account_snapshots",
    uniqueConstraints = @UniqueConstraint(columnNames = {"account_id", "version"})
)
public class AccountSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID of the account this snapshot belongs to. */
    @Column(name = "account_id", nullable = false, length = 100)
    private String accountId;

    /** Version of the last event folded into this snapshot. */
    @Column(nullable = false)
    private int version;

    /** Full account state at this version (stored as JSONB). */
    @Type(JsonType.class)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> state;

    @CreationTimestamp
    @Column(name = "snapshotted_at", nullable = false, updatable = false)
    private Instant snapshottedAt;

    // ─── Constructors ────────────────────────────────────────────────────────

    public AccountSnapshot() {}

    public AccountSnapshot(String accountId, int version, Map<String, Object> state) {
        this.accountId = accountId;
        this.version = version;
        this.state = state;
    }

    // ─── Getters / Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }
    public String getAccountId() { return accountId; }
    public int getVersion() { return version; }
    public Map<String, Object> getState() { return state; }
    public Instant getSnapshottedAt() { return snapshottedAt; }
}
