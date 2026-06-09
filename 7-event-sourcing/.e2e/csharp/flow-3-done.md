# Flow 3 — Đọc event log thô (audit trail, append-only) (csharp)

```
$ curl -s http://localhost:3010/accounts/acc_1781036411626_d2ceb5/events
[
  {
    "id": 1,
    "aggregateId": "acc_1781036411626_d2ceb5",
    "aggregateType": "Account",
    "version": 1,
    "eventType": "AccountOpened",
    "payload": {
      "type": "AccountOpened",
      "owner": "Alice",
      "accountId": "acc_1781036411626_d2ceb5",
      "initialBalance": 1000
    },
    "occurredAt": "2026-06-09T20:20:11.6718Z"
  },
  {
    "id": 2,
    "aggregateId": "acc_1781036411626_d2ceb5",
    "aggregateType": "Account",
    "version": 2,
    "eventType": "MoneyDeposited",
    "payload": {
      "type": "MoneyDeposited",
      "amount": 500,
      "accountId": "acc_1781036411626_d2ceb5"
    },
    "occurredAt": "2026-06-09T20:20:12.007563Z"
  },
  {
    "id": 3,
    "aggregateId": "acc_1781036411626_d2ceb5",
    "aggregateType": "Account",
    "version": 3,
    "eventType": "MoneyWithdrawn",
    "payload": {
      "type": "MoneyWithdrawn",
      "amount": 200,
      "accountId": "acc_1781036411626_d2ceb5"
    },
    "occurredAt": "2026-06-09T20:20:12.066859Z"
  }
]
```
