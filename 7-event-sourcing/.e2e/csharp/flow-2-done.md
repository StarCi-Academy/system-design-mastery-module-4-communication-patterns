# Flow 2 — Nạp & rút tiền, projection cập nhật (csharp)

```
$ curl -s -X POST http://localhost:3010/accounts/acc_1781036411626_d2ceb5/deposit -d '{"amount":500}'
{
  "accountId": "acc_1781036411626_d2ceb5",
  "owner": "Alice",
  "balance": 1500,
  "status": "open",
  "version": 2,
  "openedAt": "2026-06-09T20:20:11.6718Z",
  "lastEventAt": "2026-06-09T20:20:12.0075636Z"
}

$ curl -s -X POST http://localhost:3010/accounts/acc_1781036411626_d2ceb5/withdraw -d '{"amount":200}'
{
  "accountId": "acc_1781036411626_d2ceb5",
  "owner": "Alice",
  "balance": 1300,
  "status": "open",
  "version": 3,
  "openedAt": "2026-06-09T20:20:11.6718Z",
  "lastEventAt": "2026-06-09T20:20:12.0668599Z"
}

# balance kỳ vọng: 1000 + 500 - 200 = 1300
```
