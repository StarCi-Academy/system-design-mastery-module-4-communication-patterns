# Flow 3 — Đọc event log thô (audit trail, append-only) (go)

```
$ curl -s http://localhost:3010/accounts/acc_1781036296140_1e2p9d/events
[
  {
    "id": 1,
    "aggregateId": "acc_1781036296140_1e2p9d",
    "aggregateType": "Account",
    "version": 1,
    "eventType": "AccountOpened",
    "payload": {
      "type": "AccountOpened",
      "owner": "Alice",
      "accountId": "acc_1781036296140_1e2p9d",
      "initialBalance": 1000
    },
    "occurredAt": "2026-06-09T20:18:16.140436Z"
  },
  {
    "id": 2,
    "aggregateId": "acc_1781036296140_1e2p9d",
    "aggregateType": "Account",
    "version": 2,
    "eventType": "MoneyDeposited",
    "payload": {
      "type": "MoneyDeposited",
      "amount": 500,
      "accountId": "acc_1781036296140_1e2p9d"
    },
    "occurredAt": "2026-06-09T20:18:16.37188Z"
  },
  {
    "id": 3,
    "aggregateId": "acc_1781036296140_1e2p9d",
    "aggregateType": "Account",
    "version": 3,
    "eventType": "MoneyWithdrawn",
    "payload": {
      "type": "MoneyWithdrawn",
      "amount": 200,
      "accountId": "acc_1781036296140_1e2p9d"
    },
    "occurredAt": "2026-06-09T20:18:16.438182Z"
  }
]
```
