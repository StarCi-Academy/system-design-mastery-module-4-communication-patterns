// Order Service — Minimal API (ASP.NET Core 8)
// Receives POST /orders, stores the order in-memory, publishes ORDER_CREATED to Kafka,
// then returns immediately (fire-and-forget / temporal decoupling).

using System.Collections.Concurrent;
using System.Text.Json;
using Confluent.Kafka;

var builder = WebApplication.CreateBuilder(args);

// Read Kafka bootstrap address from environment so Docker Compose can inject it.
// Falls back to localhost:9092 for direct local testing.
var bootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS")
    ?? "localhost:9092";

// Build a single Confluent.Kafka producer shared for the life of the process.
// IProducer is thread-safe and expensive to create, so register as singleton.
var config = new ProducerConfig
{
    // Where Kafka brokers can be reached — injected via env var in Docker Compose.
    BootstrapServers = bootstrapServers
};
var producer = new ProducerBuilder<string, string>(config).Build();
builder.Services.AddSingleton(producer);

var app = builder.Build();

// In-memory store for demo purposes — production would use a database.
// ConcurrentDictionary is safe for concurrent ASP.NET Core request threads.
var orders = new ConcurrentDictionary<int, Order>();

// GET /orders — return all created orders so the learner can verify persistence.
app.MapGet("/orders", () => orders.Values);

// POST /orders — create order, publish event, return 201 immediately.
app.MapPost("/orders", async (CreateOrderDto dto, IProducer<string, string> prod) =>
{
    // Generate a random numeric order ID for demo purposes.
    var orderId = Random.Shared.Next(1, 100000);

    // Record order as PENDING — state is never updated by consumers (demo only).
    var order = new Order(orderId, dto.ProductName, dto.Quantity, "PENDING");
    orders.TryAdd(orderId, order);

    try
    {
        // Build the event payload matching the lesson contract.
        var ev = new
        {
            eventType = "ORDER_CREATED",
            orderId = orderId,
            productName = dto.ProductName,
            quantity = dto.Quantity,
            // ISO 8601 UTC timestamp for correlation in logs.
            timestamp = DateTime.UtcNow.ToString("o")
        };
        var message = JsonSerializer.Serialize(ev);

        // Fire-and-forget enough: we await only the local produce, not consumer processing.
        // ProduceAsync returns as soon as the broker acknowledges receipt of the batch —
        // Inventory and Notification will consume asynchronously in their own time.
        await prod.ProduceAsync("order-events", new Message<string, string> { Value = message });
    }
    catch (Exception ex)
    {
        // Log but do not fail the HTTP response: order is already recorded.
        Console.WriteLine($"Error publishing event: {ex.Message}");
    }

    // Return 201 Created immediately — consumer processing is decoupled in time.
    return Results.Json(order, statusCode: 201);
});

// Bind to all interfaces so Docker can forward traffic from the host.
app.Run("http://0.0.0.0:3001");

// DTO for POST /orders request body.
public record CreateOrderDto(string ProductName, int Quantity);

// Order domain model returned to the client.
public record Order(int Id, string ProductName, int Quantity, string Status);
