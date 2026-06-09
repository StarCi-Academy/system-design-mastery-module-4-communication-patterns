# Flow 1 — Mở tài khoản & đọc projection (typescript)

```
$ curl -s -X POST http://localhost:3000/accounts -H 'Content-Type: application/json' -d '{"owner":"Alice","initialBalance":1000}'
{
  "accountId": "acc_1781036228516_kapnch"
}

$ curl -s http://localhost:3000/accounts/acc_1781036228516_kapnch
{
  "accountId": "acc_1781036228516_kapnch",
  "owner": "Alice",
  "balance": 1000,
  "status": "open",
  "version": 1,
  "openedAt": "2026-06-09T20:17:08.516Z",
  "lastEventAt": "2026-06-09T20:17:08.516Z"
}
```
