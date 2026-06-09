# Flow 3 — Đọc event log thô (audit trail, append-only) (java)

```
$ curl -s http://localhost:3100/accounts/acc_1781036514078_476509/events
[
  {
    "id": 1,
    "aggregateId": "acc_1781036514078_476509",
    "aggregateType": "Account",
    "version": 1,
    "eventType": "AccountOpened",
    "payload": {
      "type": "AccountOpened",
      "owner": "Alice",
      "accountId": "acc_1781036514078_476509",
      "initialBalance": 1000
    },
    "occurredAt": "2026-06-09T20:21:54.211296Z"
  },
  {
    "id": 2,
    "aggregateId": "acc_1781036514078_476509",
    "aggregateType": "Account",
    "version": 2,
    "eventType": "MoneyDeposited",
    "payload": {
      "type": "MoneyDeposited",
      "amount": 500,
      "accountId": "acc_1781036514078_476509"
    },
    "occurredAt": "2026-06-09T20:21:54.516153Z"
  },
  {
    "id": 3,
    "aggregateId": "acc_1781036514078_476509",
    "aggregateType": "Account",
    "version": 3,
    "eventType": "MoneyWithdrawn",
    "payload": {
      "type": "MoneyWithdrawn",
      "amount": 200,
      "accountId": "acc_1781036514078_476509"
    },
    "occurredAt": "2026-06-09T20:21:54.582635Z"
  }
]
```
