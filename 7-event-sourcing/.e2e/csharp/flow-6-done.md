# Flow 6 — Edge/failure: rút quá số dư & thao tác trên account đã đóng (csharp)

```
$ curl -s -i -X POST http://localhost:3010/accounts/acc_1781036411626_d2ceb5/withdraw -d '{"amount":999999}'  # vượt số dư -> 400
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
Date: Tue, 09 Jun 2026 20:20:12 GMT
Server: Kestrel
Transfer-Encoding: chunked

{"message":"Insufficient balance: 1300 < 999999"}
$ curl -s -X POST http://localhost:3010/accounts/acc_1781036411626_d2ceb5/close -d '{"reason":"customer request"}'
{
  "accountId": "acc_1781036411626_d2ceb5",
  "owner": "Alice",
  "balance": 1300,
  "status": "closed",
  "version": 4,
  "openedAt": "2026-06-09T20:20:11.6718Z",
  "lastEventAt": "2026-06-09T20:20:12.4390999Z"
}

$ curl -s -i -X POST http://localhost:3010/accounts/acc_1781036411626_d2ceb5/deposit -d '{"amount":50}'  # account đã đóng -> 400
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
Date: Tue, 09 Jun 2026 20:20:12 GMT
Server: Kestrel
Transfer-Encoding: chunked

{"message":"Account acc_1781036411626_d2ceb5 is closed"}
```
