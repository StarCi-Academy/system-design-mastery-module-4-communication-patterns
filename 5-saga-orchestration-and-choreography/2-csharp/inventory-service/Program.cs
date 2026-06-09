// Inventory Service — ASP.NET Core 8 minimal API + MongoDB + Kafka producer/consumer.
// Saga choreography step 3: consume PAYMENT_CAPTURED, decrement stock, emit INVENTORY_OK/OUT_OF_STOCK.
// Also exposes POST /check for manual stock reservation (mirrors TS StockController.check).

using Confluent.Kafka;
using MongoDB.Driver;
using InventoryService;

// ── Configuration ─────────────────────────────────────────────────────────────
var kafkaBrokers = Environment.GetEnvironmentVariable("KAFKA_BROKERS")   ?? "localhost:9092";
var mongoUri     = Environment.GetEnvironmentVariable("MONGO_URI")       ?? "mongodb://localhost:27017";
var port         = int.Parse(Environment.GetEnvironmentVariable("PORT")  ?? "3003");
const string ConsumerGroup = "inventory-service-group";
const string DbName        = "inventory";

// ── Builder ───────────────────────────────────────────────────────────────────
var builder = WebApplication.CreateBuilder(args);

// MongoDB client — singleton lifetime matches application lifetime.
builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoUri));
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(DbName));

// Register strongly-typed collections — scoped so they can be injected into scoped services.
builder.Services.AddScoped(sp =>
    sp.GetRequiredService<IMongoDatabase>().GetCollection<Product>("products"));
builder.Services.AddScoped(sp =>
    sp.GetRequiredService<IMongoDatabase>().GetCollection<Fulfillment>("fulfillments"));

// Kafka producer — singleton, thread-safe.
builder.Services.AddSingleton<IProducer<string, string>>(_ =>
    new ProducerBuilder<string, string>(new ProducerConfig { BootstrapServers = kafkaBrokers }).Build());

// Kafka consumer config — used by SagaConsumerService.
builder.Services.AddSingleton(_ => new ConsumerConfig
{
    BootstrapServers  = kafkaBrokers,
    GroupId           = ConsumerGroup,
    AutoOffsetReset   = AutoOffsetReset.Earliest,
    EnableAutoCommit  = true,
});

// Core business logic service — scoped because it depends on scoped Mongo collections.
builder.Services.AddScoped<StockService>();

// Background Kafka consumer.
builder.Services.AddHostedService<SagaConsumerService>();

var app = builder.Build();

// ── Seed initial stock data on startup (mirrors TS SeedService.onModuleInit) ──
using (var scope = app.Services.CreateScope())
{
    var productCol = scope.ServiceProvider.GetRequiredService<IMongoCollection<Product>>();
    var count = await productCol.CountDocumentsAsync(FilterDefinition<Product>.Empty);
    if (count == 0)
    {
        // Seed product 1 with 0 stock (out-of-stock demo) and product 2 with 50 stock.
        await productCol.InsertManyAsync(new[]
        {
            new Product { Id = 1, Stock = 0  },
            new Product { Id = 2, Stock = 50 },
        });
    }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /check — manual stock reservation endpoint.
// Mirrors TS StockController.check → StockService.tryFulfill.
app.MapPost("/check", async (CheckRequest req, StockService stock) =>
{
    var result = await stock.TryFulfillAsync(req.OrderId, req.ProductId, req.Quantity);
    return Results.Ok(result);
});

app.Run($"http://0.0.0.0:{port}");
