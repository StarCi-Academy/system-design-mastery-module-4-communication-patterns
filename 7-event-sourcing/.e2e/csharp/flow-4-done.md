# Flow 4 — Time-travel: state tại version cũ (csharp)

```
$ curl -s http://localhost:3010/accounts/acc_1781036411626_d2ceb5/state-at/1   # ngay sau khi mở
{
  "accountId": "acc_1781036411626_d2ceb5",
  "owner": "Alice",
  "balance": 1000,
  "status": "open",
  "version": 1,
  "openedAt": "2026-06-09T20:20:11.6718Z",
  "lastEventAt": "2026-06-09T20:20:11.6718Z"
}

$ curl -s http://localhost:3010/accounts/acc_1781036411626_d2ceb5/state-at/2   # sau deposit
{
  "accountId": "acc_1781036411626_d2ceb5",
  "owner": "Alice",
  "balance": 1500,
  "status": "open",
  "version": 2,
  "openedAt": "2026-06-09T20:20:11.6718Z",
  "lastEventAt": "2026-06-09T20:20:12.007563Z"
}

# balance tại v1=1000, v2=1500 (chưa trừ 200)
```
