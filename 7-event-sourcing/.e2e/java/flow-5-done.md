# Flow 5 — Rebuild projection từ event log (derived data) (java)

```
$ curl -s -X POST http://localhost:3100/projections/rebuild
{
  "rebuilt": 1,
  "accounts": [
    {
      "accountId": "acc_1781036514078_476509",
      "owner": "Alice",
      "balance": 1300,
      "status": "open",
      "version": 3,
      "openedAt": "2026-06-09T20:21:54.211296Z",
      "lastEventAt": "2026-06-09T20:21:54.582635Z"
    }
  ]
}
```
