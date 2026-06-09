package com.starci.eventstore;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * AccountController — REST API for the Event Store Service.
 *
 * <p>Endpoints (identical to the TypeScript track):
 * <pre>
 *   POST   /accounts                   — open new account (OpenAccount command)
 *   POST   /accounts/{id}/deposit      — deposit money (Deposit command)
 *   POST   /accounts/{id}/withdraw     — withdraw money (Withdraw command)
 *   POST   /accounts/{id}/close        — close account (Close command)
 *   GET    /accounts/{id}              — current projection (read model)
 *   GET    /accounts/{id}/events       — raw event log (audit / time-travel)
 *   GET    /accounts/{id}/state-at/{v} — state at specific version (time-travel)
 *   POST   /accounts/{id}/snapshots    — take manual snapshot
 *   POST   /projections/rebuild        — rebuild all projections
 * </pre>
 */
@RestController
public class AccountController {

    private static final Logger log = LoggerFactory.getLogger(AccountController.class);

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    // ─── Commands ────────────────────────────────────────────────────────────

    /**
     * POST /accounts — open a new account.
     * Body: { "owner": string, "initialBalance": number }
     */
    @PostMapping("/accounts")
    public ResponseEntity<Map<String, String>> openAccount(@RequestBody Map<String, Object> body) {
        String owner = (String) body.get("owner");
        double initialBalance = toDouble(body.get("initialBalance"));
        log.info("POST /accounts owner={}", owner);
        return ResponseEntity.ok(accountService.openAccount(owner, initialBalance));
    }

    /**
     * POST /accounts/{id}/deposit — deposit money.
     * Body: { "amount": number }
     */
    @PostMapping("/accounts/{id}/deposit")
    public ResponseEntity<AccountState> deposit(
            @PathVariable("id") String id,
            @RequestBody Map<String, Object> body) {
        double amount = toDouble(body.get("amount"));
        log.info("POST /accounts/{}/deposit amount={}", id, amount);
        return ResponseEntity.ok(accountService.deposit(id, amount));
    }

    /**
     * POST /accounts/{id}/withdraw — withdraw money.
     * Body: { "amount": number }
     */
    @PostMapping("/accounts/{id}/withdraw")
    public ResponseEntity<AccountState> withdraw(
            @PathVariable("id") String id,
            @RequestBody Map<String, Object> body) {
        double amount = toDouble(body.get("amount"));
        log.info("POST /accounts/{}/withdraw amount={}", id, amount);
        return ResponseEntity.ok(accountService.withdraw(id, amount));
    }

    /**
     * POST /accounts/{id}/close — close an account.
     * Body: { "reason": string }
     */
    @PostMapping("/accounts/{id}/close")
    public ResponseEntity<AccountState> closeAccount(
            @PathVariable("id") String id,
            @RequestBody Map<String, Object> body) {
        String reason = (String) body.get("reason");
        log.info("POST /accounts/{}/close reason={}", id, reason);
        return ResponseEntity.ok(accountService.closeAccount(id, reason));
    }

    // ─── Queries ─────────────────────────────────────────────────────────────

    /**
     * GET /accounts/{id} — return current projection (replay event log).
     */
    @GetMapping("/accounts/{id}")
    public ResponseEntity<AccountState> getProjection(@PathVariable("id") String id) {
        log.info("GET /accounts/{}", id);
        return ResponseEntity.ok(accountService.getProjection(id));
    }

    /**
     * GET /accounts/{id}/events — return full raw event log (audit trail).
     */
    @GetMapping("/accounts/{id}/events")
    public ResponseEntity<List<EventRecord>> getEventLog(@PathVariable("id") String id) {
        log.info("GET /accounts/{}/events", id);
        return ResponseEntity.ok(accountService.getEventLog(id));
    }

    /**
     * GET /accounts/{id}/state-at/{version} — time-travel: state at a specific version.
     */
    @GetMapping("/accounts/{id}/state-at/{version}")
    public ResponseEntity<AccountState> getStateAtVersion(
            @PathVariable("id") String id,
            @PathVariable("version") int version) {
        log.info("GET /accounts/{}/state-at/{}", id, version);
        return ResponseEntity.ok(accountService.getStateAtVersion(id, version));
    }

    /**
     * POST /accounts/{id}/snapshots — manually take a snapshot for the account.
     */
    @PostMapping("/accounts/{id}/snapshots")
    public ResponseEntity<AccountSnapshot> takeSnapshot(@PathVariable("id") String id) {
        log.info("POST /accounts/{}/snapshots", id);
        return ResponseEntity.ok(accountService.takeSnapshot(id));
    }

    // ─── Projection management ───────────────────────────────────────────────

    /**
     * POST /projections/rebuild — rebuild all projections.
     */
    @PostMapping("/projections/rebuild")
    public ResponseEntity<Map<String, Object>> rebuildAll() {
        log.info("POST /projections/rebuild");
        return ResponseEntity.ok(accountService.rebuildAllProjections());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static double toDouble(Object v) {
        if (v instanceof Number n) return n.doubleValue();
        if (v == null) return 0;
        return Double.parseDouble(v.toString());
    }
}
