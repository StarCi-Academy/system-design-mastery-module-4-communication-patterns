# Flow 5 — Rebuild projection từ event log (derived data) (typescript)

```
$ curl -s -X POST http://localhost:3000/projections/rebuild
{
  "rebuilt": 1,
  "accounts": [
    {
      "accountId": "acc_1781036228516_kapnch",
      "owner": "Alice",
      "balance": 1300,
      "status": "open",
      "version": 3,
      "openedAt": "2026-06-09T20:17:08.516Z",
      "lastEventAt": "2026-06-09T20:17:08.826Z"
    }
  ]
}
```
