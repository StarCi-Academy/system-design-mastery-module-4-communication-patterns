# Flow 3 — Đọc event log thô (audit trail, append-only) (typescript)

```
$ curl -s http://localhost:3000/accounts/acc_1781036228516_kapnch/events
[
  {
    "id": 1,
    "aggregateId": "acc_1781036228516_kapnch",
    "aggregateType": "Account",
    "version": 1,
    "eventType": "AccountOpened",
    "payload": {
      "type": "AccountOpened",
      "owner": "Alice",
      "accountId": "acc_1781036228516_kapnch",
      "initialBalance": 1000
    },
    "occurredAt": "2026-06-09T20:17:08.516Z"
  },
  {
    "id": 2,
    "aggregateId": "acc_1781036228516_kapnch",
    "aggregateType": "Account",
    "version": 2,
    "eventType": "MoneyDeposited",
    "payload": {
      "type": "MoneyDeposited",
      "amount": 500,
      "accountId": "acc_1781036228516_kapnch"
    },
    "occurredAt": "2026-06-09T20:17:08.762Z"
  },
  {
    "id": 3,
    "aggregateId": "acc_1781036228516_kapnch",
    "aggregateType": "Account",
    "version": 3,
    "eventType": "MoneyWithdrawn",
    "payload": {
      "type": "MoneyWithdrawn",
      "amount": 200,
      "accountId": "acc_1781036228516_kapnch"
    },
    "occurredAt": "2026-06-09T20:17:08.826Z"
  }
]
```
