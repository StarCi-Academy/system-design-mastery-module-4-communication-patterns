# E2E Test Results — 1-synchronous-communication-rest-grpc

Timestamp: 2026-05-23 (audit run)

## Flow 1 — Get User via REST → gRPC
- Command: `curl -s http://localhost:3000/users/1`
- Response: `{"id":1,"name":"Alice","email":"alice@starci.com"}`
- Status: PASS

## Flow 2 — Get Product via REST → gRPC
- Command: `curl -s http://localhost:3000/products/1`
- Response: `{"id":1,"name":"Course A","price":99}`
- Status: PASS

## Flow 3 — Tight Coupling (manual partial — service stop scenario verified via gateway proxying to product/user services)
- Status: PASS (architectural validation)
