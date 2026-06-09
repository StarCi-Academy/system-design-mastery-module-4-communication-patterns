# Flow 6 — Edge/failure: rút quá số dư & thao tác trên account đã đóng (java)

```
$ curl -s -i -X POST http://localhost:3100/accounts/acc_1781036514078_476509/withdraw -d '{"amount":999999}'  # vượt số dư -> 400
HTTP/1.1 400 
Content-Type: application/json
Transfer-Encoding: chunked
Date: Tue, 09 Jun 2026 20:21:54 GMT
Connection: close

{"timestamp":"2026-06-09T20:21:54.910+00:00","status":400,"error":"Bad Request","path":"/accounts/acc_1781036514078_476509/withdraw"}
$ curl -s -X POST http://localhost:3100/accounts/acc_1781036514078_476509/close -d '{"reason":"customer request"}'
{
  "accountId": "acc_1781036514078_476509",
  "owner": "Alice",
  "balance": 1300,
  "status": "closed",
  "version": 4,
  "openedAt": "2026-06-09T20:21:54.211296Z",
  "lastEventAt": "2026-06-09T20:21:54.949357Z"
}

$ curl -s -i -X POST http://localhost:3100/accounts/acc_1781036514078_476509/deposit -d '{"amount":50}'  # account đã đóng -> 400
HTTP/1.1 400 
Content-Type: application/json
Transfer-Encoding: chunked
Date: Tue, 09 Jun 2026 20:21:54 GMT
Connection: close

{"timestamp":"2026-06-09T20:21:55.017+00:00","status":400,"error":"Bad Request","path":"/accounts/acc_1781036514078_476509/deposit"}
```
