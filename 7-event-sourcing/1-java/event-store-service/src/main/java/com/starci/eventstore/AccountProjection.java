package com.starci.eventstore;

import java.util.List;
import java.util.Map;

/**
 * AccountProjection — pure static utility that folds an event log into {@link AccountState}.
 *
 * <p>No side effects, no DB access. Mirrors the TypeScript {@code applyEvent} /
 * {@code replayEvents} pure functions in {@code account-projection.ts}.
 */
public final class AccountProjection {

    private AccountProjection() {}

    /**
     * Apply a single event onto the current state and return the new state.
     * Pure function — does not mutate the input state.
     *
     * @param state      current state
     * @param event      event record to apply
     * @return new {@link AccountState} after applying the event
     */
    public static AccountState applyEvent(AccountState state, EventRecord event) {
        AccountState next = copy(state);
        next.setVersion(event.getVersion());
        next.setLastEventAt(event.getOccurredAt());

        Map<String, Object> payload = event.getPayload();
        String type = (String) payload.get("type");

        switch (type) {
            case "AccountOpened" -> {
                next.setOwner((String) payload.get("owner"));
                next.setBalance(toDouble(payload.get("initialBalance")));
                next.setStatus("open");
                next.setOpenedAt(event.getOccurredAt());
            }
            case "MoneyDeposited" ->
                next.setBalance(state.getBalance() + toDouble(payload.get("amount")));
            case "MoneyWithdrawn" ->
                next.setBalance(state.getBalance() - toDouble(payload.get("amount")));
            case "AccountClosed" ->
                next.setStatus("closed");
            default ->
                throw new IllegalArgumentException("Unknown event type: " + type);
        }
        return next;
    }

    /**
     * Replay a full sorted event list and return the final {@link AccountState}.
     *
     * @param accountId  aggregate ID (used to seed the empty state)
     * @param events     events sorted by version ASC
     * @return           final projected state
     */
    public static AccountState replayEvents(String accountId, List<EventRecord> events) {
        AccountState state = new AccountState(accountId);
        for (EventRecord e : events) {
            state = applyEvent(state, e);
        }
        return state;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static AccountState copy(AccountState s) {
        AccountState c = new AccountState();
        c.setAccountId(s.getAccountId());
        c.setOwner(s.getOwner());
        c.setBalance(s.getBalance());
        c.setStatus(s.getStatus());
        c.setVersion(s.getVersion());
        c.setOpenedAt(s.getOpenedAt());
        c.setLastEventAt(s.getLastEventAt());
        return c;
    }

    private static double toDouble(Object v) {
        if (v instanceof Number n) return n.doubleValue();
        return Double.parseDouble(String.valueOf(v));
    }
}
