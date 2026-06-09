// Inventory Service — ASP.NET Core 8 minimal API.
// Manages product stock in MongoDB and consumes `order-events` from Kafka.
// Contract mirrors the TypeScript NestJS track:
//   POST /inventory          → create product with initial stock → 201
//   background consumer      → `order-events` → decrement stock by productName + quantity
// Host port 3022 (TS: 3002, Java: 3012) — set via PORT env var.

using System.Text.Json;
using Confluent.Kafka;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);

// ── Configuration ──────────────────────────────────────────────────────────
// Read from environment variables set by Docker Compose.
var mongoUri   = Environment.GetEnvironmentVariable("INVENTORY_MONGO_URI") ?? "mongodb://localhost:27017/inventory_db";
var kafkaBrokers = Environment.GetEnvironmentVariable("KAFKA_BROKERS")     ?? "localhost:9092";
var groupId    = Environment.GetEnvironmentVariable("KAFKA_GROUP_ID")      ?? "inventory-consumer-group";
var port       = int.Parse(Environment.GetEnvironmentVariable("PORT")      ?? "3022");

// ── MongoDB ────────────────────────────────────────────────────────────────
// Register MongoClient as singleton — reuse connection pool across requests.
builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoUri));
builder.Services.AddSingleton<IMongoCollection<Product>>(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();
    // Parse the database name from the URI; fall back to `inventory_db`.
    var mongoUrl = new MongoUrl(mongoUri);
    var dbName   = mongoUrl.DatabaseName ?? "inventory_db";
    var db       = client.GetDatabase(dbName);
    // Collection name `products` — mirrors Mongoose @Schema({ collection: "products" }).
    return db.GetCollection<Product>("products");
});

// ── Kafka consumer (hosted background service) ─────────────────────────────
builder.Services.AddSingleton(new ConsumerConfig
{
    BootstrapServers = kafkaBrokers,
    GroupId          = groupId,
    // Read from earliest so no events are missed on restart.
    AutoOffsetReset  = AutoOffsetReset.Earliest,
});
builder.Services.AddHostedService<OrderEventsConsumer>();

var app = builder.Build();

// ── POST /inventory ────────────────────────────────────────────────────────
// Accepts: { name, stock }
// Inserts a new product document into MongoDB `products` collection.
app.MapPost("/inventory", async (CreateProductRequest req,
    IMongoCollection<Product> products) =>
{
    if (string.IsNullOrWhiteSpace(req.Name) || req.Stock < 0)
        return Results.BadRequest(new { error = "name is required and stock must be >= 0." });

    var product = new Product { Name = req.Name, Stock = req.Stock };
    await products.InsertOneAsync(product);

    // Return 201 with the inserted document (including generated _id).
    return Results.Created($"/inventory/{product.Id}", product);
});

app.Run($"http://0.0.0.0:{port}");

// ── Domain models ──────────────────────────────────────────────────────────
/// <summary>
/// Product document stored in MongoDB `products` collection.
/// Mirrors TypeScript Product Mongoose schema: name (string), stock (number).
/// </summary>
public class Product
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id    { get; set; }

    [BsonElement("name")]
    public string  Name  { get; set; } = string.Empty;

    [BsonElement("stock")]
    public int     Stock { get; set; }
}

/// <summary>
/// Request body for POST /inventory.
/// </summary>
public record CreateProductRequest(string Name, int Stock);

/// <summary>
/// Kafka event payload published by order-service on the `order-events` topic.
/// Mirrors TypeScript OrderEventPayload: productName?, quantity?
/// </summary>
public record OrderEventPayload(
    int?    OrderId,
    string? CustomerId,
    decimal? TotalAmount,
    string? ProductName,
    int?    Quantity
);

// ── Kafka background consumer ──────────────────────────────────────────────
/// <summary>
/// Hosted background service that consumes `order-events` and decrements stock.
/// Equivalent to the NestJS @EventPattern("order-events") controller in the TS track.
/// </summary>
public class OrderEventsConsumer(
    ConsumerConfig            config,
    IServiceProvider          services,
    ILogger<OrderEventsConsumer> logger
) : BackgroundService
{
    private const string Topic = "order-events";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Yield immediately so the host can finish starting Kestrel — the poll loop
        // below uses the synchronous Consume(), which would otherwise block startup.
        await Task.Yield();

        // Build consumer inside the hosted service — not DI-registered directly
        // because IConsumer<> is not thread-safe to share.
        using var consumer = new ConsumerBuilder<Ignore, string>(config).Build();
        consumer.Subscribe(Topic);

        logger.LogInformation("OrderEventsConsumer subscribed to topic '{Topic}'", Topic);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Poll with a short timeout so we can check the cancellation token regularly.
                var result = consumer.Consume(TimeSpan.FromMilliseconds(500));
                if (result is null) continue;

                logger.LogInformation(
                    "Received '{Topic}' message: {Value}", Topic, result.Message.Value);

                // Deserialize the JSON payload published by order-service.
                var payload = JsonSerializer.Deserialize<OrderEventPayload>(
                    result.Message.Value,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (payload?.ProductName is { Length: > 0 } name
                    && payload.Quantity is int quantity && quantity > 0)
                {
                    await DecrementStockAsync(name, quantity, services, logger, stoppingToken);
                }
            }
            catch (ConsumeException ex)
            {
                // Log and continue — do not crash the service on transient Kafka errors.
                logger.LogError(ex, "Kafka consume error: {Reason}", ex.Error.Reason);
            }
        }

        consumer.Close();
    }

    /// <summary>
    /// Decrements stock for the named product using a scoped MongoDB collection.
    /// Mirrors TypeScript InventoryService.decrementStockByProductName().
    /// </summary>
    private static async Task DecrementStockAsync(
        string name, int quantity,
        IServiceProvider services,
        ILogger logger,
        CancellationToken ct)
    {
        // Use a scope to resolve the scoped/singleton collection safely from a background thread.
        await using var scope = services.CreateAsyncScope();
        var products = scope.ServiceProvider.GetRequiredService<IMongoCollection<Product>>();

        // Find the product by name — same as Mongoose findOne({ name }).
        var product = await products.Find(p => p.Name == name).FirstOrDefaultAsync(ct);

        if (product is null)
        {
            logger.LogWarning("Product '{Name}' not found in inventory — skipping decrement.", name);
            return;
        }

        if (product.Stock < quantity)
        {
            logger.LogWarning(
                "Insufficient stock for '{Name}': have {Stock}, need {Quantity}.",
                name, product.Stock, quantity);
            return;
        }

        logger.LogInformation(
            "Decrementing stock for '{Name}' by {Quantity} (current: {Stock}).",
            name, quantity, product.Stock);

        // Atomically decrement the stock field using $inc — avoids read-modify-write races.
        var filter = Builders<Product>.Filter.Eq(p => p.Name, name);
        var update = Builders<Product>.Update.Inc(p => p.Stock, -quantity);
        await products.UpdateOneAsync(filter, update, cancellationToken: ct);
    }
}
