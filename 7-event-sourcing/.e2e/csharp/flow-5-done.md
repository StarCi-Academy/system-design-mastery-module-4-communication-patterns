# Flow 5 — Rebuild projection từ event log (derived data) (csharp)

```
$ curl -s -X POST http://localhost:3010/projections/rebuild
{
  "rebuilt": 1,
  "accounts": [
    {
      "accountId": "acc_1781036411626_d2ceb5",
      "owner": "Alice",
      "balance": 1300,
      "status": "open",
      "version": 3,
      "openedAt": "2026-06-09T20:20:11.6718Z",
      "lastEventAt": "2026-06-09T20:20:12.066859Z"
    }
  ]
}
```
