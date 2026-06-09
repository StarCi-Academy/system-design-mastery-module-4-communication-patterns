package com.starci.eventstore;

import java.time.Instant;

/**
 * AccountState — read model (projection) computed by replaying the event log.
 *
 * <p>Fields mirror the TypeScript {@code AccountState} interface exactly so the
 * REST response shape is identical across language tracks.
 */
public class AccountState {

    private String accountId;
    private String owner;
    private double balance;
    private String status; // "open" | "closed"
    private int version;
    private Instant openedAt;
    private Instant lastEventAt;

    // ─── Constructors ────────────────────────────────────────────────────────

    public AccountState() {}

    public AccountState(String accountId) {
        this.accountId = accountId;
        this.owner = "";
        this.balance = 0;
        this.status = "open";
        this.version = 0;
        this.openedAt = null;
        this.lastEventAt = null;
    }

    // ─── Getters / Setters ───────────────────────────────────────────────────

    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }

    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }

    public double getBalance() { return balance; }
    public void setBalance(double balance) { this.balance = balance; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }

    public Instant getOpenedAt() { return openedAt; }
    public void setOpenedAt(Instant openedAt) { this.openedAt = openedAt; }

    public Instant getLastEventAt() { return lastEventAt; }
    public void setLastEventAt(Instant lastEventAt) { this.lastEventAt = lastEventAt; }
}
