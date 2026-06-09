# Flow 4 — Time-travel: state tại version cũ (go)

```
$ curl -s http://localhost:3010/accounts/acc_1781036296140_1e2p9d/state-at/1   # ngay sau khi mở
{
  "accountId": "acc_1781036296140_1e2p9d",
  "owner": "Alice",
  "balance": 1000,
  "status": "open",
  "version": 1,
  "openedAt": "2026-06-09T20:18:16.140436Z",
  "lastEventAt": "2026-06-09T20:18:16.140436Z"
}

$ curl -s http://localhost:3010/accounts/acc_1781036296140_1e2p9d/state-at/2   # sau deposit
{
  "accountId": "acc_1781036296140_1e2p9d",
  "owner": "Alice",
  "balance": 1500,
  "status": "open",
  "version": 2,
  "openedAt": "2026-06-09T20:18:16.140436Z",
  "lastEventAt": "2026-06-09T20:18:16.37188Z"
}

# balance tại v1=1000, v2=1500 (chưa trừ 200)
```
