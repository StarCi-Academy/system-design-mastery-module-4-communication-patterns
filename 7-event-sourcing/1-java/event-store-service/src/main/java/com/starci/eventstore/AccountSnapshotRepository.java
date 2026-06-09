package com.starci.eventstore;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * AccountSnapshotRepository — Spring Data JPA repository for account_snapshots.
 */
public interface AccountSnapshotRepository extends JpaRepository<AccountSnapshot, Long> {

    /** Find the latest snapshot for an account (highest version). */
    Optional<AccountSnapshot> findTopByAccountIdOrderByVersionDesc(String accountId);

    /** Find a snapshot at an exact version (used for idempotency check). */
    Optional<AccountSnapshot> findByAccountIdAndVersion(String accountId, int version);
}
