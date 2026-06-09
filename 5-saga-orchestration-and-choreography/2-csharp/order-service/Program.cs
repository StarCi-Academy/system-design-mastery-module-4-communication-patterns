// Order Service — ASP.NET Core 8 minimal API + PostgreSQL (EF Core) + Kafka producer/consumer.
// Saga choreography step 1: create order PENDING in PG, emit ORDER_CREATED.
// Also consumes saga.demo.events to update order status (INVENTORY_OK → COMPLETED, etc.).

using Microsoft.EntityFrameworkCore;
using Confluent.Kafka;
using System.Text.Json;
using OrderService;

// ── Configuration ─────────────────────────────────────────────────────────────
var kafkaBrokers  = Environment.GetEnvironmentVariable("KAFKA_BROKERS")   ?? "localhost:9092";
var postgresConn  = Environment.GetEnvironmentVariable("POSTGRES_URL")    ?? "Host=localhost;Port=5432;Database=orders;Username=postgres;Password=postgres";
var port          = int.Parse(Environment.GetEnvironmentVariable("PORT")  ?? "3001");
const string Topic         = "saga.demo.events";
const string ConsumerGroup = "order-service-group";

// ── Builder ───────────────────────────────────────────────────────────────────
var builder = WebApplication.CreateBuilder(args);

// Register EF Core with Npgsql for order persistence.
builder.Services.AddDbContext<OrderDbContext>(opts =>
    opts.UseNpgsql(postgresConn));

builder.Services.AddSingleton<IProducer<string, string>>(sp =>
{
    var cfg = new ProducerConfig { BootstrapServers = kafkaBrokers };
    return new ProducerBuilder<string, string>(cfg).Build();
});

// Kafka consumer background service — listens for INVENTORY_OK / INVENTORY_OUT_OF_STOCK / PAYMENT_REFUNDED.
builder.Services.AddSingleton(sp => new ConsumerConfig
{
    BootstrapServers      = kafkaBrokers,
    GroupId               = ConsumerGroup,
    AutoOffsetReset       = AutoOffsetReset.Earliest,
    EnableAutoCommit      = true,
});
builder.Services.AddHostedService<SagaConsumerService>();

var app = builder.Build();

// Apply EF Core migrations (create table if not exists).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    db.Database.EnsureCreated();
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /order — create order PENDING, emit ORDER_CREATED to Kafka.
app.MapPost("/order", async (OrderRequest req, OrderDbContext db, IProducer<string, string> producer) =>
{
    // Persist order with PENDING status before emitting event to guarantee idempotency.
    var order = new Order { ProductId = req.ProductId, Quantity = req.Quantity, Status = "PENDING" };
    db.Orders.Add(order);
    await db.SaveChangesAsync();

    // Emit ORDER_CREATED so downstream saga participants (payment, inventory) react.
    var evt = JsonSerializer.Serialize(new
    {
        @event   = "ORDER_CREATED",
        orderId  = order.Id,
        productId = order.ProductId,
        quantity  = order.Quantity,
    });
    await producer.ProduceAsync(Topic, new Message<string, string> { Key = order.Id.ToString(), Value = evt });

    return Results.Ok(new { order.Id, order.ProductId, order.Quantity, order.Status });
});

app.Run($"http://0.0.0.0:{port}");
