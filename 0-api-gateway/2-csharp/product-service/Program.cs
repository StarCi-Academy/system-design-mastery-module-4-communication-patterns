// Product Service — ASP.NET Core minimal API managing products in memory.
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var products = new List<ProductRecord>();
var lockObj = new object();
var counter = 0;

// POST /products — create a new product and return HTTP 201.
app.MapPost("/products", (ProductRequest req) =>
{
    int id;
    ProductRecord created;
    lock (lockObj)
    {
        id = ++counter;
        created = new ProductRecord(id, req.Name, req.Price, req.Stock);
        products.Add(created);
    }
    return Results.Created($"/products/{id}", created);
});

// GET /products — list all products.
app.MapGet("/products", () =>
{
    lock (lockObj) { return Results.Ok(products.ToList()); }
});

app.Run("http://0.0.0.0:3002");

record ProductRecord(int Id, string Name, decimal Price, int Stock);
record ProductRequest(string Name, decimal Price, int Stock);
