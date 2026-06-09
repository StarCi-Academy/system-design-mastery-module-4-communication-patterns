# Flow 2 — Nạp & rút tiền, projection cập nhật (go)

```
$ curl -s -X POST http://localhost:3010/accounts/acc_1781036296140_1e2p9d/deposit -d '{"amount":500}'
{
  "accountId": "acc_1781036296140_1e2p9d",
  "owner": "Alice",
  "balance": 1500,
  "status": "open",
  "version": 2,
  "openedAt": "2026-06-09T20:18:16.140436Z",
  "lastEventAt": "2026-06-09T20:18:16.37188Z"
}

$ curl -s -X POST http://localhost:3010/accounts/acc_1781036296140_1e2p9d/withdraw -d '{"amount":200}'
{
  "accountId": "acc_1781036296140_1e2p9d",
  "owner": "Alice",
  "balance": 1300,
  "status": "open",
  "version": 3,
  "openedAt": "2026-06-09T20:18:16.140436Z",
  "lastEventAt": "2026-06-09T20:18:16.438182Z"
}

# balance kỳ vọng: 1000 + 500 - 200 = 1300
```
