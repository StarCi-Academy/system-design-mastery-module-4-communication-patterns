// Package main — Event Store Service: append-only event log with projection replay.
//
// Architecture:
//   Client → REST (net/http :3000) → PostgreSQL (events + account_snapshots tables)
//
// Endpoints:
//   POST   /accounts                      — open new account (OpenAccount command)
//   POST   /accounts/{id}/deposit         — deposit money (Deposit command)
//   POST   /accounts/{id}/withdraw        — withdraw money (Withdraw command)
//   POST   /accounts/{id}/close           — close account (Close command)
//   GET    /accounts/{id}                 — current projection (replay → AccountState)
//   GET    /accounts/{id}/events          — raw event log (audit trail)
//   GET    /accounts/{id}/state-at/{ver}  — time-travel: state at version N
//   POST   /accounts/{id}/snapshots       — take manual snapshot
//   POST   /projections/rebuild           — rebuild all projections
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ─── Domain types ─────────────────────────────────────────────────────────────

// AccountState is the current read model derived by replaying domain events.
type AccountState struct {
	AccountID   string     `json:"accountId"`
	Owner       string     `json:"owner"`
	Balance     float64    `json:"balance"`
	Status      string     `json:"status"`      // "open" | "closed"
	Version     int        `json:"version"`
	OpenedAt    *time.Time `json:"openedAt"`
	LastEventAt *time.Time `json:"lastEventAt"`
}

// EventRow represents one row from the events table.
type EventRow struct {
	ID            int64           `json:"id"`
	AggregateID   string          `json:"aggregateId"`
	AggregateType string          `json:"aggregateType"`
	Version       int             `json:"version"`
	EventType     string          `json:"eventType"`
	Payload       json.RawMessage `json:"payload"`
	OccurredAt    time.Time       `json:"occurredAt"`
}

// SnapshotRow represents one row from the account_snapshots table.
type SnapshotRow struct {
	ID             int64           `json:"id"`
	AccountID      string          `json:"accountId"`
	Version        int             `json:"version"`
	State          json.RawMessage `json:"state"`
	SnapshottedAt  time.Time       `json:"snapshottedAt"`
}

// ─── Pure projection logic ────────────────────────────────────────────────────

// emptyAccountState returns the zero-value state for a new aggregate.
func emptyAccountState(accountID string) AccountState {
	return AccountState{
		AccountID: accountID,
		Owner:     "",
		Balance:   0,
		Status:    "open",
		Version:   0,
	}
}

// applyEvent folds one event payload into the current AccountState (pure, no side effects).
func applyEvent(state AccountState, payload map[string]interface{}, occurredAt time.Time, version int) AccountState {
	state.Version = version
	state.LastEventAt = &occurredAt

	eventType, _ := payload["type"].(string)
	switch eventType {
	case "AccountOpened":
		owner, _ := payload["owner"].(string)
		balance, _ := toFloat64(payload["initialBalance"])
		t := occurredAt
		state.Owner = owner
		state.Balance = balance
		state.Status = "open"
		state.OpenedAt = &t
	case "MoneyDeposited":
		amount, _ := toFloat64(payload["amount"])
		state.Balance += amount
	case "MoneyWithdrawn":
		amount, _ := toFloat64(payload["amount"])
		state.Balance -= amount
	case "AccountClosed":
		state.Status = "closed"
	}
	return state
}

// replayEvents replays a sorted slice of EventRows onto an empty state.
func replayEvents(accountID string, rows []EventRow) (AccountState, error) {
	state := emptyAccountState(accountID)
	for _, row := range rows {
		var payload map[string]interface{}
		if err := json.Unmarshal(row.Payload, &payload); err != nil {
			return state, fmt.Errorf("unmarshal payload version %d: %w", row.Version, err)
		}
		state = applyEvent(state, payload, row.OccurredAt, row.Version)
	}
	return state, nil
}

// toFloat64 converts JSON-decoded numbers (float64 or json.Number) to float64.
func toFloat64(v interface{}) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case int64:
		return float64(n), true
	case json.Number:
		f, err := n.Float64()
		return f, err == nil
	}
	return 0, false
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

// hashAggregateID hashes an aggregate ID string to an int32 for pg advisory locks.
func hashAggregateID(id string) int32 {
	var h int32
	for _, c := range id {
		h = (h<<5 - h) + int32(c)
	}
	return h
}

// loadEventRows fetches all events for an aggregate ordered by version ASC.
func loadEventRows(ctx context.Context, pool *pgxpool.Pool, aggregateID string) ([]EventRow, error) {
	rows, err := pool.Query(ctx,
		`SELECT id, aggregate_id, aggregate_type, version, event_type, payload, occurred_at
		   FROM events
		  WHERE aggregate_id = $1
		  ORDER BY version ASC`,
		aggregateID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanEventRows(rows)
}

// scanEventRows converts pgx rows into EventRow slice.
func scanEventRows(rows pgx.Rows) ([]EventRow, error) {
	var result []EventRow
	for rows.Next() {
		var r EventRow
		var payloadBytes []byte
		if err := rows.Scan(&r.ID, &r.AggregateID, &r.AggregateType, &r.Version, &r.EventType, &payloadBytes, &r.OccurredAt); err != nil {
			return nil, err
		}
		r.Payload = json.RawMessage(payloadBytes)
		result = append(result, r)
	}
	return result, rows.Err()
}

// loadState builds AccountState for accountID using snapshot + subsequent events.
func loadState(ctx context.Context, pool *pgxpool.Pool, accountID string) (AccountState, error) {
	// Find the latest snapshot (if any).
	var snap *SnapshotRow
	{
		var s SnapshotRow
		var stateBytes []byte
		err := pool.QueryRow(ctx,
			`SELECT id, account_id, version, state, snapshotted_at
			   FROM account_snapshots
			  WHERE account_id = $1
			  ORDER BY version DESC
			  LIMIT 1`,
			accountID,
		).Scan(&s.ID, &s.AccountID, &s.Version, &stateBytes, &s.SnapshottedAt)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return AccountState{}, err
		}
		if err == nil {
			s.State = json.RawMessage(stateBytes)
			snap = &s
		}
	}

	// Load all events for this aggregate.
	allRows, err := loadEventRows(ctx, pool, accountID)
	if err != nil {
		return AccountState{}, err
	}

	if len(allRows) == 0 && snap == nil {
		return AccountState{}, &notFoundError{msg: fmt.Sprintf("account %s not found", accountID)}
	}

	if snap != nil {
		// Decode snapshot state and fold any newer events on top.
		var state AccountState
		if err2 := json.Unmarshal(snap.State, &state); err2 != nil {
			return AccountState{}, fmt.Errorf("unmarshal snapshot: %w", err2)
		}
		for _, row := range allRows {
			if row.Version <= snap.Version {
				continue
			}
			var payload map[string]interface{}
			if err2 := json.Unmarshal(row.Payload, &payload); err2 != nil {
				return AccountState{}, err2
			}
			state = applyEvent(state, payload, row.OccurredAt, row.Version)
		}
		return state, nil
	}

	// No snapshot — replay from scratch.
	return replayEvents(accountID, allRows)
}

// appendEvent inserts one domain event inside a serialized transaction using pg advisory lock.
func appendEvent(ctx context.Context, pool *pgxpool.Pool, aggregateID, aggregateType string, payload interface{}) (int, error) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return 0, err
	}

	conn, err := pool.Acquire(ctx)
	if err != nil {
		return 0, err
	}
	defer conn.Release()

	tx, err := conn.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// Advisory lock per aggregate to serialise concurrent writes.
	lockKey := hashAggregateID(aggregateID)
	if _, err2 := tx.Exec(ctx, `SELECT pg_advisory_xact_lock($1)`, lockKey); err2 != nil {
		return 0, err2
	}

	// Determine next version.
	var maxVersion *int
	err = tx.QueryRow(ctx,
		`SELECT MAX(version) FROM events WHERE aggregate_id = $1`,
		aggregateID,
	).Scan(&maxVersion)
	if err != nil {
		return 0, err
	}
	nextVersion := 1
	if maxVersion != nil {
		nextVersion = *maxVersion + 1
	}

	// Extract event_type from payload map.
	var eventType string
	if m, ok := payload.(map[string]interface{}); ok {
		eventType, _ = m["type"].(string)
	}

	if _, err2 := tx.Exec(ctx,
		`INSERT INTO events (aggregate_id, aggregate_type, version, event_type, payload)
		 VALUES ($1, $2, $3, $4, $5)`,
		aggregateID, aggregateType, nextVersion, eventType, payloadBytes,
	); err2 != nil {
		return 0, err2
	}

	if err3 := tx.Commit(ctx); err3 != nil {
		return 0, err3
	}
	return nextVersion, nil
}

// ─── Snapshot helper ──────────────────────────────────────────────────────────

// snapshotThreshold — auto-snapshot every N events.
const snapshotThreshold = 10

// takeSnapshotInternal persists the current AccountState as a snapshot row.
func takeSnapshotInternal(ctx context.Context, pool *pgxpool.Pool, accountID string) (*SnapshotRow, error) {
	state, err := loadState(ctx, pool, accountID)
	if err != nil {
		return nil, err
	}

	// Check for existing snapshot at same version to avoid duplicates.
	var existing int
	_ = pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM account_snapshots WHERE account_id = $1 AND version = $2`,
		accountID, state.Version,
	).Scan(&existing)
	if existing > 0 {
		// Return existing snapshot row.
		var s SnapshotRow
		var stateBytes []byte
		err2 := pool.QueryRow(ctx,
			`SELECT id, account_id, version, state, snapshotted_at
			   FROM account_snapshots
			  WHERE account_id = $1 AND version = $2`,
			accountID, state.Version,
		).Scan(&s.ID, &s.AccountID, &s.Version, &stateBytes, &s.SnapshottedAt)
		if err2 != nil {
			return nil, err2
		}
		s.State = json.RawMessage(stateBytes)
		return &s, nil
	}

	stateJSON, err := json.Marshal(state)
	if err != nil {
		return nil, err
	}

	var s SnapshotRow
	var stateBytes []byte
	err = pool.QueryRow(ctx,
		`INSERT INTO account_snapshots (account_id, version, state)
		 VALUES ($1, $2, $3)
		 RETURNING id, account_id, version, state, snapshotted_at`,
		accountID, state.Version, stateJSON,
	).Scan(&s.ID, &s.AccountID, &s.Version, &stateBytes, &s.SnapshottedAt)
	if err != nil {
		return nil, err
	}
	s.State = json.RawMessage(stateBytes)
	return &s, nil
}

// ─── Error types ──────────────────────────────────────────────────────────────

type notFoundError struct{ msg string }

func (e *notFoundError) Error() string { return e.msg }

type badRequestError struct{ msg string }

func (e *badRequestError) Error() string { return e.msg }

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

// writeJSON serialises v as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("writeJSON encode error: %v", err)
	}
}

// writeError maps domain errors to HTTP status codes.
func writeError(w http.ResponseWriter, err error) {
	var nfe *notFoundError
	var bre *badRequestError
	switch {
	case errors.As(err, &nfe):
		writeJSON(w, http.StatusNotFound, map[string]string{"message": err.Error()})
	case errors.As(err, &bre):
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": err.Error()})
	default:
		log.Printf("internal error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "internal server error"})
	}
}

// decodeBody decodes JSON request body into dst.
func decodeBody(r *http.Request, dst interface{}) error {
	return json.NewDecoder(r.Body).Decode(dst)
}

// pathSegments splits the URL path into non-empty segments.
func pathSegments(path string) []string {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	var result []string
	for _, p := range parts {
		if p != "" {
			result = append(result, p)
		}
	}
	return result
}

// ─── Handler: POST /accounts ──────────────────────────────────────────────────

// handleOpenAccount opens a new bank account.
// Body: { "owner": string, "initialBalance": number }
func handleOpenAccount(ctx context.Context, pool *pgxpool.Pool, w http.ResponseWriter, r *http.Request) {
	var body struct {
		Owner          string  `json:"owner"`
		InitialBalance float64 `json:"initialBalance"`
	}
	if err := decodeBody(r, &body); err != nil {
		writeError(w, &badRequestError{msg: "invalid JSON body"})
		return
	}
	if body.Owner == "" {
		writeError(w, &badRequestError{msg: "owner is required"})
		return
	}

	accountID := fmt.Sprintf("acc_%d_%s", time.Now().UnixMilli(), randSuffix())
	payload := map[string]interface{}{
		"type":           "AccountOpened",
		"accountId":      accountID,
		"owner":          body.Owner,
		"initialBalance": body.InitialBalance,
	}

	version, err := appendEvent(ctx, pool, accountID, "Account", payload)
	if err != nil {
		writeError(w, err)
		return
	}
	log.Printf("AccountOpened: %s owner=%s version=%d", accountID, body.Owner, version)
	writeJSON(w, http.StatusCreated, map[string]string{"accountId": accountID})
}

// ─── Handler: POST /accounts/{id}/deposit ─────────────────────────────────────

func handleDeposit(ctx context.Context, pool *pgxpool.Pool, w http.ResponseWriter, r *http.Request, accountID string) {
	var body struct {
		Amount float64 `json:"amount"`
	}
	if err := decodeBody(r, &body); err != nil {
		writeError(w, &badRequestError{msg: "invalid JSON body"})
		return
	}
	if body.Amount <= 0 {
		writeError(w, &badRequestError{msg: "amount must be positive"})
		return
	}

	state, err := loadState(ctx, pool, accountID)
	if err != nil {
		writeError(w, err)
		return
	}
	if state.Status == "closed" {
		writeError(w, &badRequestError{msg: fmt.Sprintf("account %s is closed", accountID)})
		return
	}

	payload := map[string]interface{}{
		"type":      "MoneyDeposited",
		"accountId": accountID,
		"amount":    body.Amount,
	}
	version, err := appendEvent(ctx, pool, accountID, "Account", payload)
	if err != nil {
		writeError(w, err)
		return
	}
	log.Printf("MoneyDeposited: %s amount=%.2f version=%d", accountID, body.Amount, version)
	// Return projection after the event is persisted.
	maybeAutoSnapshot(ctx, pool, accountID, version)
	result, err := loadState(ctx, pool, accountID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ─── Handler: POST /accounts/{id}/withdraw ────────────────────────────────────

func handleWithdraw(ctx context.Context, pool *pgxpool.Pool, w http.ResponseWriter, r *http.Request, accountID string) {
	var body struct {
		Amount float64 `json:"amount"`
	}
	if err := decodeBody(r, &body); err != nil {
		writeError(w, &badRequestError{msg: "invalid JSON body"})
		return
	}
	if body.Amount <= 0 {
		writeError(w, &badRequestError{msg: "amount must be positive"})
		return
	}

	state, err := loadState(ctx, pool, accountID)
	if err != nil {
		writeError(w, err)
		return
	}
	if state.Status == "closed" {
		writeError(w, &badRequestError{msg: fmt.Sprintf("account %s is closed", accountID)})
		return
	}
	if state.Balance < body.Amount {
		writeError(w, &badRequestError{msg: fmt.Sprintf("insufficient balance: %.2f < %.2f", state.Balance, body.Amount)})
		return
	}

	payload := map[string]interface{}{
		"type":      "MoneyWithdrawn",
		"accountId": accountID,
		"amount":    body.Amount,
	}
	version, err := appendEvent(ctx, pool, accountID, "Account", payload)
	if err != nil {
		writeError(w, err)
		return
	}
	log.Printf("MoneyWithdrawn: %s amount=%.2f version=%d", accountID, body.Amount, version)
	maybeAutoSnapshot(ctx, pool, accountID, version)
	result, err := loadState(ctx, pool, accountID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ─── Handler: POST /accounts/{id}/close ──────────────────────────────────────

func handleClose(ctx context.Context, pool *pgxpool.Pool, w http.ResponseWriter, r *http.Request, accountID string) {
	var body struct {
		Reason string `json:"reason"`
	}
	if err := decodeBody(r, &body); err != nil {
		writeError(w, &badRequestError{msg: "invalid JSON body"})
		return
	}
	if body.Reason == "" {
		writeError(w, &badRequestError{msg: "reason is required"})
		return
	}

	state, err := loadState(ctx, pool, accountID)
	if err != nil {
		writeError(w, err)
		return
	}
	if state.Status == "closed" {
		writeError(w, &badRequestError{msg: fmt.Sprintf("account %s is already closed", accountID)})
		return
	}

	payload := map[string]interface{}{
		"type":      "AccountClosed",
		"accountId": accountID,
		"reason":    body.Reason,
	}
	version, err := appendEvent(ctx, pool, accountID, "Account", payload)
	if err != nil {
		writeError(w, err)
		return
	}
	log.Printf("AccountClosed: %s reason=%s version=%d", accountID, body.Reason, version)
	result, err := loadState(ctx, pool, accountID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ─── Handler: GET /accounts/{id} ─────────────────────────────────────────────

func handleGetProjection(ctx context.Context, pool *pgxpool.Pool, w http.ResponseWriter, accountID string) {
	state, err := loadState(ctx, pool, accountID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, state)
}

// ─── Handler: GET /accounts/{id}/events ──────────────────────────────────────

func handleGetEventLog(ctx context.Context, pool *pgxpool.Pool, w http.ResponseWriter, accountID string) {
	rows, err := loadEventRows(ctx, pool, accountID)
	if err != nil {
		writeError(w, err)
		return
	}
	if len(rows) == 0 {
		writeError(w, &notFoundError{msg: fmt.Sprintf("account %s not found", accountID)})
		return
	}
	writeJSON(w, http.StatusOK, rows)
}

// ─── Handler: GET /accounts/{id}/state-at/{version} ──────────────────────────

func handleGetStateAtVersion(ctx context.Context, pool *pgxpool.Pool, w http.ResponseWriter, accountID string, version int) {
	allRows, err := loadEventRows(ctx, pool, accountID)
	if err != nil {
		writeError(w, err)
		return
	}
	var sliced []EventRow
	for _, r := range allRows {
		if r.Version <= version {
			sliced = append(sliced, r)
		}
	}
	if len(sliced) == 0 {
		writeError(w, &notFoundError{msg: fmt.Sprintf("account %s not found or no events at version %d", accountID, version)})
		return
	}
	state, err := replayEvents(accountID, sliced)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, state)
}

// ─── Handler: POST /accounts/{id}/snapshots ──────────────────────────────────

func handleTakeSnapshot(ctx context.Context, pool *pgxpool.Pool, w http.ResponseWriter, accountID string) {
	snap, err := takeSnapshotInternal(ctx, pool, accountID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, snap)
}

// ─── Handler: POST /projections/rebuild ──────────────────────────────────────

func handleRebuildProjections(ctx context.Context, pool *pgxpool.Pool, w http.ResponseWriter) {
	rows, err := pool.Query(ctx,
		`SELECT DISTINCT aggregate_id FROM events WHERE aggregate_type = 'Account'`,
	)
	if err != nil {
		writeError(w, err)
		return
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err2 := rows.Scan(&id); err2 != nil {
			writeError(w, err2)
			return
		}
		ids = append(ids, id)
	}
	if err2 := rows.Err(); err2 != nil {
		writeError(w, err2)
		return
	}

	var accounts []AccountState
	for _, id := range ids {
		state, err2 := loadState(ctx, pool, id)
		if err2 != nil {
			log.Printf("rebuild: skip %s: %v", id, err2)
			continue
		}
		accounts = append(accounts, state)
		log.Printf("Rebuilt projection: %s balance=%.2f status=%s", id, state.Balance, state.Status)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"rebuilt":  len(accounts),
		"accounts": accounts,
	})
}

// ─── Auto-snapshot ────────────────────────────────────────────────────────────

// maybeAutoSnapshot fires a background snapshot every snapshotThreshold events.
func maybeAutoSnapshot(ctx context.Context, pool *pgxpool.Pool, accountID string, version int) {
	if version%snapshotThreshold == 0 {
		go func() {
			snapCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()
			if _, err := takeSnapshotInternal(snapCtx, pool, accountID); err != nil {
				log.Printf("auto-snapshot failed for %s: %v", accountID, err)
			}
		}()
	}
}

// ─── Routing ──────────────────────────────────────────────────────────────────

// newRouter returns the root HTTP handler.
// Route table (no external router dependency — standard net/http mux with path parsing):
//
//	POST /accounts                         → openAccount
//	POST /accounts/{id}/deposit            → deposit
//	POST /accounts/{id}/withdraw           → withdraw
//	POST /accounts/{id}/close              → close
//	GET  /accounts/{id}                    → getProjection
//	GET  /accounts/{id}/events             → getEventLog
//	GET  /accounts/{id}/state-at/{version} → getStateAtVersion
//	POST /accounts/{id}/snapshots          → takeSnapshot
//	POST /projections/rebuild              → rebuildProjections
func newRouter(pool *pgxpool.Pool) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		segs := pathSegments(r.URL.Path)

		// POST /projections/rebuild
		if len(segs) == 2 && segs[0] == "projections" && segs[1] == "rebuild" && r.Method == http.MethodPost {
			handleRebuildProjections(ctx, pool, w)
			return
		}

		// All /accounts routes.
		if len(segs) == 0 || segs[0] != "accounts" {
			writeJSON(w, http.StatusNotFound, map[string]string{"message": "not found"})
			return
		}

		// POST /accounts
		if len(segs) == 1 && r.Method == http.MethodPost {
			handleOpenAccount(ctx, pool, w, r)
			return
		}

		if len(segs) < 2 {
			writeJSON(w, http.StatusNotFound, map[string]string{"message": "not found"})
			return
		}

		accountID := segs[1]

		// GET /accounts/{id}
		if len(segs) == 2 && r.Method == http.MethodGet {
			handleGetProjection(ctx, pool, w, accountID)
			return
		}

		if len(segs) < 3 {
			writeJSON(w, http.StatusNotFound, map[string]string{"message": "not found"})
			return
		}

		sub := segs[2]

		switch {
		// POST /accounts/{id}/deposit
		case sub == "deposit" && r.Method == http.MethodPost:
			handleDeposit(ctx, pool, w, r, accountID)

		// POST /accounts/{id}/withdraw
		case sub == "withdraw" && r.Method == http.MethodPost:
			handleWithdraw(ctx, pool, w, r, accountID)

		// POST /accounts/{id}/close
		case sub == "close" && r.Method == http.MethodPost:
			handleClose(ctx, pool, w, r, accountID)

		// GET /accounts/{id}/events
		case sub == "events" && r.Method == http.MethodGet:
			handleGetEventLog(ctx, pool, w, accountID)

		// POST /accounts/{id}/snapshots
		case sub == "snapshots" && r.Method == http.MethodPost:
			handleTakeSnapshot(ctx, pool, w, accountID)

		// GET /accounts/{id}/state-at/{version}
		case sub == "state-at" && r.Method == http.MethodGet && len(segs) == 4:
			v, err := strconv.Atoi(segs[3])
			if err != nil {
				writeError(w, &badRequestError{msg: "version must be an integer"})
				return
			}
			handleGetStateAtVersion(ctx, pool, w, accountID, v)

		default:
			writeJSON(w, http.StatusNotFound, map[string]string{"message": "not found"})
		}
	})

	return mux
}

// ─── Schema init ─────────────────────────────────────────────────────────────

// ensureSchema creates the events and account_snapshots tables if absent.
// Using CREATE TABLE IF NOT EXISTS is safe for the lab/demo use-case.
func ensureSchema(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS events (
			id             BIGSERIAL PRIMARY KEY,
			aggregate_id   VARCHAR(100) NOT NULL,
			aggregate_type VARCHAR(100) NOT NULL,
			version        INT          NOT NULL,
			event_type     VARCHAR(100) NOT NULL,
			payload        JSONB        NOT NULL,
			occurred_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
			UNIQUE (aggregate_id, version)
		);
		CREATE INDEX IF NOT EXISTS idx_events_aggregate_id ON events (aggregate_id);

		CREATE TABLE IF NOT EXISTS account_snapshots (
			id              BIGSERIAL PRIMARY KEY,
			account_id      VARCHAR(100) NOT NULL,
			version         INT          NOT NULL,
			state           JSONB        NOT NULL,
			snapshotted_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
			UNIQUE (account_id, version)
		);
		CREATE INDEX IF NOT EXISTS idx_snapshots_account_id ON account_snapshots (account_id);
	`)
	return err
}

// ─── Random suffix for account IDs ───────────────────────────────────────────

// randSuffix generates a short pseudo-random alphanumeric suffix.
// Uses the current nanosecond as entropy — sufficient for a lab/demo.
func randSuffix() string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	ns := time.Now().UnixNano()
	b := make([]byte, 6)
	for i := range b {
		b[i] = chars[ns%int64(len(chars))]
		ns /= int64(len(chars))
	}
	return string(b)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

func main() {
	// Read config from environment variables (set by Docker Compose).
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "eventsource")
	dbPassword := getEnv("DB_PASSWORD", "eventsource")
	dbName := getEnv("DB_NAME", "event_store")
	port := getEnv("PORT", "3000")

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s", dbUser, dbPassword, dbHost, dbPort, dbName)

	ctx := context.Background()

	// Connect with retry (Postgres may not be ready immediately).
	var pool *pgxpool.Pool
	var connErr error
	for i := 0; i < 20; i++ {
		var p *pgxpool.Pool
		p, connErr = pgxpool.New(ctx, dsn)
		if connErr == nil {
			if pingErr := p.Ping(ctx); pingErr == nil {
				pool = p
				break
			} else {
				p.Close()
				connErr = pingErr
			}
		}
		log.Printf("waiting for postgres (%d/20): %v", i+1, connErr)
		time.Sleep(2 * time.Second)
	}
	if pool == nil {
		log.Fatalf("could not connect to postgres: %v", connErr)
	}
	defer pool.Close()
	log.Println("connected to postgres")

	// Initialise schema (idempotent).
	if err := ensureSchema(ctx, pool); err != nil {
		log.Fatalf("ensureSchema: %v", err)
	}
	log.Println("schema ready")

	router := newRouter(pool)

	addr := "0.0.0.0:" + port
	log.Printf("event-store-service listening on %s", addr)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

// getEnv returns the environment variable named key, or fallback if unset.
func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}
