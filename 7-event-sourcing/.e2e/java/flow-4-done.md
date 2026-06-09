# Flow 4 — Time-travel: state tại version cũ (java)

```
$ curl -s http://localhost:3100/accounts/acc_1781036514078_476509/state-at/1   # ngay sau khi mở
{
  "accountId": "acc_1781036514078_476509",
  "owner": "Alice",
  "balance": 1000,
  "status": "open",
  "version": 1,
  "openedAt": "2026-06-09T20:21:54.211296Z",
  "lastEventAt": "2026-06-09T20:21:54.211296Z"
}

$ curl -s http://localhost:3100/accounts/acc_1781036514078_476509/state-at/2   # sau deposit
{
  "accountId": "acc_1781036514078_476509",
  "owner": "Alice",
  "balance": 1500,
  "status": "open",
  "version": 2,
  "openedAt": "2026-06-09T20:21:54.211296Z",
  "lastEventAt": "2026-06-09T20:21:54.516153Z"
}

# balance tại v1=1000, v2=1500 (chưa trừ 200)
```
