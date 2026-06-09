// Order Service — ASP.NET Core minimal API managing orders in memory.
// Business invariant: every order starts in "PENDING" state — enforced here, not in the gateway.
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var orders = new List<OrderRecord>();
var lockObj = new object();
var counter = 0;

// POST /orders — create a new order with PENDING status and return HTTP 201.
app.MapPost("/orders", (OrderRequest req) =>
{
    int id;
    OrderRecord created;
    lock (lockObj)
    {
        id = ++counter;
        // Business rule: status is always "PENDING" at creation; gateway does not touch this.
        created = new OrderRecord(id, req.ProductId, req.Quantity, "PENDING");
        orders.Add(created);
    }
    return Results.Created($"/orders/{id}", created);
});

// GET /orders — list all orders.
app.MapGet("/orders", () =>
{
    lock (lockObj) { return Results.Ok(orders.ToList()); }
});

app.Run("http://0.0.0.0:3003");

record OrderRecord(int Id, int ProductId, int Quantity, string Status);
record OrderRequest(int ProductId, int Quantity);
