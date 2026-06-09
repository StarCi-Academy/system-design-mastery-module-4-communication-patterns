# 7 — Event Sourcing: event log là nguồn sự thật

## Overview

State is never stored directly. Instead, every change is recorded as an immutable domain **event** appended to an **append-only event log** (Postgres `events` table). Current state (the **projection**) is derived on-demand by **replaying** the event sequence. Snapshots optimise replay for long-lived aggregates.

## Architecture

```
Client
  │
  ▼ REST
event-store-service  (NestJS :3000)
  │
  ▼ Postgres
  ├── events            ← append-only log (aggregate_id, version, event_type, payload, occurred_at)
  └── account_snapshots ← optional snapshot at version N
```

## Start

```bash
cd .docker
docker compose up -d --build
```

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/accounts` | Open account (`{ owner, initialBalance }`) |
| POST | `/accounts/:id/deposit` | Deposit (`{ amount }`) |
| POST | `/accounts/:id/withdraw` | Withdraw (`{ amount }`) |
| POST | `/accounts/:id/close` | Close (`{ reason }`) |
| GET | `/accounts/:id` | Current projection (replay → AccountState) |
| GET | `/accounts/:id/events` | Raw event log (audit trail) |
| GET | `/accounts/:id/state-at/:version` | Time-travel: state at version N |
| POST | `/accounts/:id/snapshots` | Take manual snapshot |
| POST | `/projections/rebuild` | Rebuild all projections (demo: derived data) |

## Quick demo

```bash
# 1. Open account
curl -s -X POST http://localhost:3000/accounts \
  -H 'Content-Type: application/json' \
  -d '{"owner":"Alice","initialBalance":1000}' | jq .

# 2. Deposit
curl -s -X POST http://localhost:3000/accounts/<id>/deposit \
  -H 'Content-Type: application/json' \
  -d '{"amount":500}' | jq .

# 3. Withdraw
curl -s -X POST http://localhost:3000/accounts/<id>/withdraw \
  -H 'Content-Type: application/json' \
  -d '{"amount":200}' | jq .

# 4. Get projection (current state by replay)
curl -s http://localhost:3000/accounts/<id> | jq .

# 5. Get raw event log (audit trail)
curl -s http://localhost:3000/accounts/<id>/events | jq .

# 6. Time-travel: state at version 1
curl -s http://localhost:3000/accounts/<id>/state-at/1 | jq .

# 7. Rebuild all projections
curl -s -X POST http://localhost:3000/projections/rebuild | jq .
```

## Key concepts demonstrated

- **Append-only event store** — `events` table is never updated or deleted
- **Command → Event** — a command (intent) produces an immutable event (fact)
- **Projection / Read Model** — `AccountState` computed by replaying events (`replayEvents`)
- **Time-travel** — query state at any past version
- **Audit log** — full history of every change is stored
- **Snapshotting** — auto-snapshot every 10 events to optimise future replay
- **Optimistic concurrency** — `SELECT ... FOR UPDATE` + unique `(aggregate_id, version)` prevents duplicate versions
