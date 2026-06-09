# Flow 1 — Mở tài khoản & đọc projection (go)

```
$ curl -s -X POST http://localhost:3010/accounts -H 'Content-Type: application/json' -d '{"owner":"Alice","initialBalance":1000}'
{
  "accountId": "acc_1781036296140_1e2p9d"
}

$ curl -s http://localhost:3010/accounts/acc_1781036296140_1e2p9d
{
  "accountId": "acc_1781036296140_1e2p9d",
  "owner": "Alice",
  "balance": 1000,
  "status": "open",
  "version": 1,
  "openedAt": "2026-06-09T20:18:16.140436Z",
  "lastEventAt": "2026-06-09T20:18:16.140436Z"
}
```
