# Flow 6 — Edge/failure: rút quá số dư & thao tác trên account đã đóng (go)

```
$ curl -s -i -X POST http://localhost:3010/accounts/acc_1781036296140_1e2p9d/withdraw -d '{"amount":999999}'  # vượt số dư -> 400
HTTP/1.1 400 Bad Request
Content-Type: application/json
Date: Tue, 09 Jun 2026 20:18:16 GMT
Content-Length: 61

{"message":"insufficient balance: 1300.00 \u003c 999999.00"}

$ curl -s -X POST http://localhost:3010/accounts/acc_1781036296140_1e2p9d/close -d '{"reason":"customer request"}'
{
  "accountId": "acc_1781036296140_1e2p9d",
  "owner": "Alice",
  "balance": 1300,
  "status": "closed",
  "version": 4,
  "openedAt": "2026-06-09T20:18:16.140436Z",
  "lastEventAt": "2026-06-09T20:18:16.812807Z"
}

$ curl -s -i -X POST http://localhost:3010/accounts/acc_1781036296140_1e2p9d/deposit -d '{"amount":50}'  # account đã đóng -> 400
HTTP/1.1 400 Bad Request
Content-Type: application/json
Date: Tue, 09 Jun 2026 20:18:16 GMT
Content-Length: 57

{"message":"account acc_1781036296140_1e2p9d is closed"}

```
