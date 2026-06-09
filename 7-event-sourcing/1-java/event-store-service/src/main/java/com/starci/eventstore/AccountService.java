package com.starci.eventstore;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

/**
 * AccountService — processes commands and queries for the Event Store.
 *
 * <p>Main flows:
 * <ol>
 *   <li>appendEvent — receive command, validate, append event row to Postgres.</li>
 *   <li>getProjection — load event log from DB, replay, return AccountState.</li>
 *   <li>rebuildAll — replay full event log for all accounts, log results.</li>
 *   <li>takeSnapshot — compute current AccountState, persist AccountSnapshot.</li>
 * </ol>
 */
@Service
public class AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountService.class);

    /** Auto-snapshot every N events. */
    private static final int SNAPSHOT_THRESHOLD = 10;

    private final EventRecordRepository eventRepo;
    private final AccountSnapshotRepository snapshotRepo;

    @PersistenceContext
    private EntityManager em;

    public AccountService(EventRecordRepository eventRepo,
                          AccountSnapshotRepository snapshotRepo) {
        this.eventRepo = eventRepo;
        this.snapshotRepo = snapshotRepo;
    }

    // ─── Commands ────────────────────────────────────────────────────────────

    /**
     * Open a new account — append "AccountOpened" event.
     *
     * @param owner          account owner name
     * @param initialBalance initial balance (>= 0)
     * @return map with the new accountId
     */
    @Transactional
    public Map<String, String> openAccount(String owner, double initialBalance) {
        String accountId = "acc_" + System.currentTimeMillis() + "_"
                + Long.toHexString(new Random().nextLong() & 0xFFFFFFL);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "AccountOpened");
        payload.put("accountId", accountId);
        payload.put("owner", owner);
        payload.put("initialBalance", initialBalance);

        appendEvent(accountId, "Account", "AccountOpened", payload);
        log.info("AccountOpened: {} owner={}", accountId, owner);
        return Map.of("accountId", accountId);
    }

    /**
     * Deposit money — append "MoneyDeposited" event.
     *
     * @param accountId target account
     * @param amount    deposit amount (> 0)
     * @return updated AccountState projection
     */
    @Transactional
    public AccountState deposit(String accountId, double amount) {
        AccountState state = loadState(accountId);
        if ("closed".equals(state.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Account " + accountId + " is closed");
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "MoneyDeposited");
        payload.put("accountId", accountId);
        payload.put("amount", amount);
        appendEvent(accountId, "Account", "MoneyDeposited", payload);
        return loadState(accountId);
    }

    /**
     * Withdraw money — validate balance, append "MoneyWithdrawn" event.
     *
     * @param accountId target account
     * @param amount    withdrawal amount (> 0)
     * @return updated AccountState projection
     */
    @Transactional
    public AccountState withdraw(String accountId, double amount) {
        AccountState state = loadState(accountId);
        if ("closed".equals(state.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Account " + accountId + " is closed");
        }
        if (state.getBalance() < amount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Insufficient balance: " + state.getBalance() + " < " + amount);
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "MoneyWithdrawn");
        payload.put("accountId", accountId);
        payload.put("amount", amount);
        appendEvent(accountId, "Account", "MoneyWithdrawn", payload);
        return loadState(accountId);
    }

    /**
     * Close account — append "AccountClosed" event.
     *
     * @param accountId target account
     * @param reason    reason for closing
     * @return updated AccountState projection
     */
    @Transactional
    public AccountState closeAccount(String accountId, String reason) {
        AccountState state = loadState(accountId);
        if ("closed".equals(state.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Account " + accountId + " is already closed");
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "AccountClosed");
        payload.put("accountId", accountId);
        payload.put("reason", reason);
        appendEvent(accountId, "Account", "AccountClosed", payload);
        return loadState(accountId);
    }

    // ─── Queries ─────────────────────────────────────────────────────────────

    /**
     * Return the current AccountState (projection) by replaying the event log.
     *
     * @param accountId target account
     * @return current projected state
     */
    @Transactional(readOnly = true)
    public AccountState getProjection(String accountId) {
        return loadState(accountId);
    }

    /**
     * Return the full raw event log for an account (audit trail / time-travel).
     *
     * @param accountId target account
     * @return list of event records in version order
     */
    @Transactional(readOnly = true)
    public List<EventRecord> getEventLog(String accountId) {
        List<EventRecord> events = eventRepo.findByAggregateIdOrderByVersionAsc(accountId);
        if (events.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Account " + accountId + " not found");
        }
        return events;
    }

    /**
     * Time-travel: return account state at a specific version.
     *
     * @param accountId target account
     * @param version   target version (inclusive)
     * @return account state at that version
     */
    @Transactional(readOnly = true)
    public AccountState getStateAtVersion(String accountId, int version) {
        List<EventRecord> events = eventRepo.findByAggregateIdOrderByVersionAsc(accountId);
        List<EventRecord> sliced = events.stream()
                .filter(e -> e.getVersion() <= version)
                .toList();
        if (sliced.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Account " + accountId + " not found or no events at version " + version);
        }
        return AccountProjection.replayEvents(accountId, sliced);
    }

    /**
     * Manually take a snapshot for the account.
     *
     * @param accountId target account
     * @return persisted snapshot
     */
    @Transactional
    public AccountSnapshot takeSnapshot(String accountId) {
        AccountState state = loadState(accountId);
        Optional<AccountSnapshot> existing =
                snapshotRepo.findByAccountIdAndVersion(accountId, state.getVersion());
        if (existing.isPresent()) return existing.get();

        Map<String, Object> stateMap = stateToMap(state);
        AccountSnapshot snap = new AccountSnapshot(accountId, state.getVersion(), stateMap);
        return snapshotRepo.save(snap);
    }

    /**
     * Rebuild all projections — replay full event log per account, log results.
     * Used to demonstrate: "projection is derived data — can be rebuilt at any time".
     *
     * @return result summary with rebuilt count and all account states
     */
    @Transactional(readOnly = true)
    public Map<String, Object> rebuildAllProjections() {
        List<String> accountIds = eventRepo.findDistinctAggregateIdsByType("Account");
        List<AccountState> accounts = new ArrayList<>();
        for (String id : accountIds) {
            AccountState state = loadState(id);
            accounts.add(state);
            log.info("Rebuilt projection: {} balance={} status={}",
                    id, state.getBalance(), state.getStatus());
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("rebuilt", accounts.size());
        result.put("accounts", accounts);
        return result;
    }

    // ─── Internals ───────────────────────────────────────────────────────────

    /**
     * Append one domain event to the events table inside the current transaction.
     *
     * <p>Uses {@code pg_advisory_xact_lock} (via raw JPQL/native query) to serialise
     * concurrent writes for the same aggregate — mirrors the TS advisory lock pattern.
     *
     * @param aggregateId   aggregate ID
     * @param aggregateType aggregate type (e.g., "Account")
     * @param eventType     event type name
     * @param payload       event payload map
     * @return persisted EventRecord
     */
    private EventRecord appendEvent(String aggregateId, String aggregateType,
                                    String eventType, Map<String, Object> payload) {
        // Advisory lock — serialise concurrent writes for the same aggregate.
        long lockKey = hashAggregateId(aggregateId);
        em.createNativeQuery("SELECT pg_advisory_xact_lock(:key)")
                .setParameter("key", lockKey)
                .getSingleResult();

        // Compute next version.
        Number maxVersionNum = (Number) em.createQuery(
                "SELECT COALESCE(MAX(e.version), 0) FROM EventRecord e WHERE e.aggregateId = :id")
                .setParameter("id", aggregateId)
                .getSingleResult();
        int nextVersion = maxVersionNum.intValue() + 1;

        EventRecord record = new EventRecord(aggregateId, aggregateType,
                nextVersion, eventType, payload);
        em.persist(record);
        em.flush();

        // Auto-snapshot every SNAPSHOT_THRESHOLD events (best-effort, non-blocking).
        if (nextVersion % SNAPSHOT_THRESHOLD == 0) {
            try {
                takeSnapshot(aggregateId);
            } catch (Exception ex) {
                log.warn("Auto-snapshot failed for {}: {}", aggregateId, ex.getMessage());
            }
        }

        return record;
    }

    /**
     * Load AccountState by:
     * 1. Finding the latest snapshot (if any).
     * 2. Loading events with version > snapshot.version (or all if no snapshot).
     * 3. Replaying events on top of snapshot state.
     *
     * @param accountId target account
     * @return current projected state
     */
    private AccountState loadState(String accountId) {
        Optional<AccountSnapshot> snapshotOpt =
                snapshotRepo.findTopByAccountIdOrderByVersionDesc(accountId);
        List<EventRecord> allEvents =
                eventRepo.findByAggregateIdOrderByVersionAsc(accountId);

        if (allEvents.isEmpty() && snapshotOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Account " + accountId + " not found");
        }

        if (snapshotOpt.isPresent()) {
            AccountSnapshot snap = snapshotOpt.get();
            AccountState state = mapToState(snap.getState());
            List<EventRecord> eventsAfter = allEvents.stream()
                    .filter(e -> e.getVersion() > snap.getVersion())
                    .toList();
            for (EventRecord e : eventsAfter) {
                state = AccountProjection.applyEvent(state, e);
            }
            return state;
        }

        return AccountProjection.replayEvents(accountId, allEvents);
    }

    /**
     * Hash aggregateId to a 32-bit integer for use as pg_advisory_xact_lock key.
     * Uses the same djb2-style algorithm as the TypeScript source.
     *
     * @param aggregateId aggregate identifier
     * @return 32-bit hash as long
     */
    private long hashAggregateId(String aggregateId) {
        int hash = 0;
        for (char c : aggregateId.toCharArray()) {
            hash = ((hash << 5) - hash) + c;
        }
        return (long) hash;
    }

    // ─── State ↔ Map conversion ───────────────────────────────────────────────

    private Map<String, Object> stateToMap(AccountState s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("accountId", s.getAccountId());
        m.put("owner", s.getOwner());
        m.put("balance", s.getBalance());
        m.put("status", s.getStatus());
        m.put("version", s.getVersion());
        m.put("openedAt", s.getOpenedAt() != null ? s.getOpenedAt().toString() : null);
        m.put("lastEventAt", s.getLastEventAt() != null ? s.getLastEventAt().toString() : null);
        return m;
    }

    private AccountState mapToState(Map<String, Object> m) {
        AccountState s = new AccountState();
        s.setAccountId((String) m.get("accountId"));
        s.setOwner((String) m.get("owner"));
        s.setBalance(toDouble(m.get("balance")));
        s.setStatus((String) m.get("status"));
        s.setVersion(toInt(m.get("version")));
        Object openedAt = m.get("openedAt");
        if (openedAt != null) s.setOpenedAt(java.time.Instant.parse(openedAt.toString()));
        Object lastEventAt = m.get("lastEventAt");
        if (lastEventAt != null) s.setLastEventAt(java.time.Instant.parse(lastEventAt.toString()));
        return s;
    }

    private static double toDouble(Object v) {
        if (v instanceof Number n) return n.doubleValue();
        if (v == null) return 0;
        return Double.parseDouble(v.toString());
    }

    private static int toInt(Object v) {
        if (v instanceof Number n) return n.intValue();
        if (v == null) return 0;
        return Integer.parseInt(v.toString());
    }
}
