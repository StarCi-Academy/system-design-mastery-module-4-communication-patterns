# Flow 4 — Time-travel: state tại version cũ (typescript)

```
$ curl -s http://localhost:3000/accounts/acc_1781036228516_kapnch/state-at/1   # ngay sau khi mở
{
  "accountId": "acc_1781036228516_kapnch",
  "owner": "Alice",
  "balance": 1000,
  "status": "open",
  "version": 1,
  "openedAt": "2026-06-09T20:17:08.516Z",
  "lastEventAt": "2026-06-09T20:17:08.516Z"
}

$ curl -s http://localhost:3000/accounts/acc_1781036228516_kapnch/state-at/2   # sau deposit
{
  "accountId": "acc_1781036228516_kapnch",
  "owner": "Alice",
  "balance": 1500,
  "status": "open",
  "version": 2,
  "openedAt": "2026-06-09T20:17:08.516Z",
  "lastEventAt": "2026-06-09T20:17:08.762Z"
}

# balance tại v1=1000, v2=1500 (chưa trừ 200)
```
