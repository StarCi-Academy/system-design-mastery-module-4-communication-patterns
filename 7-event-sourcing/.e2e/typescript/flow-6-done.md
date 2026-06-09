# Flow 6 — Edge/failure: rút quá số dư & thao tác trên account đã đóng (typescript)

```
$ curl -s -i -X POST http://localhost:3000/accounts/acc_1781036228516_kapnch/withdraw -d '{"amount":999999}'  # vượt số dư -> 400
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 88
ETag: W/"58-eTQvaXmU/WAJ+jb5pwEz2jUXsPc"
Date: Tue, 09 Jun 2026 20:17:09 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"message":"Insufficient balance: 1300 < 999999","error":"Bad Request","statusCode":400}
$ curl -s -X POST http://localhost:3000/accounts/acc_1781036228516_kapnch/close -d '{"reason":"customer request"}'
{
  "accountId": "acc_1781036228516_kapnch",
  "owner": "Alice",
  "balance": 1300,
  "status": "closed",
  "version": 4,
  "openedAt": "2026-06-09T20:17:08.516Z",
  "lastEventAt": "2026-06-09T20:17:09.228Z"
}

$ curl -s -i -X POST http://localhost:3000/accounts/acc_1781036228516_kapnch/deposit -d '{"amount":50}'  # account đã đóng -> 400
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 95
ETag: W/"5f-yvNIS8/M+h1bVJhzXhS8+MxLVUw"
Date: Tue, 09 Jun 2026 20:17:09 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"message":"Account acc_1781036228516_kapnch is closed","error":"Bad Request","statusCode":400}
```
