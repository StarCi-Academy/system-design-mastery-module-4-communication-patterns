# Flow 1 — Mở tài khoản & đọc projection (csharp)

```
$ curl -s -X POST http://localhost:3010/accounts -H 'Content-Type: application/json' -d '{"owner":"Alice","initialBalance":1000}'
{
  "accountId": "acc_1781036411626_d2ceb5"
}

$ curl -s http://localhost:3010/accounts/acc_1781036411626_d2ceb5
{
  "accountId": "acc_1781036411626_d2ceb5",
  "owner": "Alice",
  "balance": 1000,
  "status": "open",
  "version": 1,
  "openedAt": "2026-06-09T20:20:11.6718Z",
  "lastEventAt": "2026-06-09T20:20:11.6718Z"
}
```
