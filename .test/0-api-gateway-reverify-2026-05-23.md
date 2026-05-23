# Slot 3 lesson 0 api gateway (Kong) — re-verify 2026-05-23

Flow 1 GET /users via Kong: PASS (after Kong route propagation 5s delay) — 200, returns Alice/Bob.
Flow 2 GET /products via Kong: PASS — 200, returns Laptop/Smartphone.
Flow 3 GET /orders via Kong: PASS — 200, returns 2 orders.
Flow 4 JWT plugin (advanced): PASS — after enabling jwt plugin on user-svc, /users returns 401 unauthenticated; after creating consumer+JWT cred and signing HS256 token (iss=my-starci-issuer, secret=secret123) the same path returns 200 with valid Bearer.

4/4 PASS, 0 retries.
