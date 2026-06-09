# Flow 2 — Nạp & rút tiền, projection cập nhật (java)

```
$ curl -s -X POST http://localhost:3100/accounts/acc_1781036514078_476509/deposit -d '{"amount":500}'
{
  "accountId": "acc_1781036514078_476509",
  "owner": "Alice",
  "balance": 1500,
  "status": "open",
  "version": 2,
  "openedAt": "2026-06-09T20:21:54.211296Z",
  "lastEventAt": "2026-06-09T20:21:54.516153Z"
}

$ curl -s -X POST http://localhost:3100/accounts/acc_1781036514078_476509/withdraw -d '{"amount":200}'
{
  "accountId": "acc_1781036514078_476509",
  "owner": "Alice",
  "balance": 1300,
  "status": "open",
  "version": 3,
  "openedAt": "2026-06-09T20:21:54.211296Z",
  "lastEventAt": "2026-06-09T20:21:54.582635Z"
}

# balance kỳ vọng: 1000 + 500 - 200 = 1300
```
