# Slot 3 lesson 1 sync REST→gRPC — re-verify 2026-05-23

Flow 1 GET /users/1: PASS — 200 {"id":1,"name":"Alice","email":"alice@starci.com"}.
Flow 2 GET /products/1: PASS — 200 {"id":1,"name":"Course A","price":99}.
Flow 3 tight coupling (user-service down): PASS — gateway returns 500 immediately; user-service restarted.

3/3 PASS, 0 retries.
