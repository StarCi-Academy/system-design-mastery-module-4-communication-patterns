# Flow 5 — Rebuild projection từ event log (derived data) (go)

```
$ curl -s -X POST http://localhost:3010/projections/rebuild
{
  "accounts": [
    {
      "accountId": "acc_1781036296140_1e2p9d",
      "owner": "Alice",
      "balance": 1300,
      "status": "open",
      "version": 3,
      "openedAt": "2026-06-09T20:18:16.140436Z",
      "lastEventAt": "2026-06-09T20:18:16.438182Z"
    }
  ],
  "rebuilt": 1
}
```
