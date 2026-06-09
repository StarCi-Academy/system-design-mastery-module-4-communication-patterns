# Flow 1 — Mở tài khoản & đọc projection (java)

```
$ curl -s -X POST http://localhost:3100/accounts -H 'Content-Type: application/json' -d '{"owner":"Alice","initialBalance":1000}'
{
  "accountId": "acc_1781036514078_476509"
}

$ curl -s http://localhost:3100/accounts/acc_1781036514078_476509
{
  "accountId": "acc_1781036514078_476509",
  "owner": "Alice",
  "balance": 1000,
  "status": "open",
  "version": 1,
  "openedAt": "2026-06-09T20:21:54.211296Z",
  "lastEventAt": "2026-06-09T20:21:54.211296Z"
}
```
