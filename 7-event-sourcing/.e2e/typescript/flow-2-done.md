# Flow 2 — Nạp & rút tiền, projection cập nhật (typescript)

```
$ curl -s -X POST http://localhost:3000/accounts/acc_1781036228516_kapnch/deposit -d '{"amount":500}'
{
  "accountId": "acc_1781036228516_kapnch",
  "owner": "Alice",
  "balance": 1500,
  "status": "open",
  "version": 2,
  "openedAt": "2026-06-09T20:17:08.516Z",
  "lastEventAt": "2026-06-09T20:17:08.762Z"
}

$ curl -s -X POST http://localhost:3000/accounts/acc_1781036228516_kapnch/withdraw -d '{"amount":200}'
{
  "accountId": "acc_1781036228516_kapnch",
  "owner": "Alice",
  "balance": 1300,
  "status": "open",
  "version": 3,
  "openedAt": "2026-06-09T20:17:08.516Z",
  "lastEventAt": "2026-06-09T20:17:08.826Z"
}

# balance kỳ vọng: 1000 + 500 - 200 = 1300
```
