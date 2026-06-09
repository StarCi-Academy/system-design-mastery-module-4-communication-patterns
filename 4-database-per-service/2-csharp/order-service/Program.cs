// Order Service — ASP.NET Core 8 minimal API.
// Persists orders to PostgreSQL (EF Core / Npgsql) and emits order-events to Kafka.
// Contract mirrors the TypeScript NestJS track: POST /orders → 201 + saved row.
// Host port 3021 (TS: 3001, Java: 3011) — set via PORT env var.

using System.Text.Json;
using Confluent.Kafka;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ── Configuration ──────────────────────────────────────────────────────────
// Read from environment variables set by Docker Compose.
var pgHost     = Environment.GetEnvironmentVariable("ORDER_DB_HOST")     ?? "localhost";
var pgPort     = Environment.GetEnvironmentVariable("ORDER_DB_PORT")     ?? "5432";
var pgUser     = Environment.GetEnvironmentVariable("ORDER_DB_USER")     ?? "order";
var pgPassword = Environment.GetEnvironmentVariable("ORDER_DB_PASSWORD") ?? "order";
var pgDb       = Environment.GetEnvironmentVariable("ORDER_DB_NAME")     ?? "order_db";
var kafkaBrokers = Environment.GetEnvironmentVariable("KAFKA_BROKERS")  ?? "localhost:9092";
var port       = int.Parse(Environment.GetEnvironmentVariable("PORT")    ?? "3021");

var connectionString =
    $"Host={pgHost};Port={pgPort};Username={pgUser};Password={pgPassword};Database={pgDb}";

// ── Database ───────────────────────────────────────────────────────────────
// Register EF Core with Npgsql provider.
// synchronize=false equivalent: we rely on EnsureCreated only in dev to set up the table;
// the migration strategy mirrors the TS lesson which uses TypeORM synchronize:true for dev.
builder.Services.AddDbContext<OrderDbContext>(opts =>
    opts.UseNpgsql(connectionString));

// ── Kafka producer (singleton) ─────────────────────────────────────────────
builder.Services.AddSingleton<IProducer<Null, string>>(_ =>
{
    var config = new ProducerConfig { BootstrapServers = kafkaBrokers };
    return new ProducerBuilder<Null, string>(config).Build();
});

var app = builder.Build();

// ── Migrate / create schema on startup ────────────────────────────────────
// Equivalent to TypeORM synchronize:true used in the TS dev track.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    db.Database.EnsureCreated();
}

// ── POST /orders ───────────────────────────────────────────────────────────
// Accepts: { customerId, totalAmount, productName?, quantity? }
// Persists to `orders` table, emits `order-events` Kafka message, returns 201 + saved row.
app.MapPost("/orders", async (CreateOrderRequest req, OrderDbContext db,
    IProducer<Null, string> producer) =>
{
    // Validate required fields.
    if (string.IsNullOrWhiteSpace(req.CustomerId) || req.TotalAmount <= 0)
        return Results.BadRequest(new { error = "customerId and totalAmount are required." });

    // Persist order to PostgreSQL.
    var order = new Order
    {
        CustomerId  = req.CustomerId,
        TotalAmount = Math.Round(req.TotalAmount, 2),
    };
    db.Orders.Add(order);
    await db.SaveChangesAsync();

    // Build Kafka event payload — mirrors TS: { orderId, customerId, totalAmount, productName, quantity }.
    var payload = JsonSerializer.Serialize(new
    {
        orderId     = order.Id,
        customerId  = order.CustomerId,
        totalAmount = order.TotalAmount,
        productName = req.ProductName,
        quantity    = req.Quantity,
    });

    // Emit to `order-events` topic (fire-and-forget with await to surface errors).
    await producer.ProduceAsync("order-events",
        new Message<Null, string> { Value = payload });

    return Results.Created($"/orders/{order.Id}", order);
});

app.Run($"http://0.0.0.0:{port}");

// ── EF Core DbContext ──────────────────────────────────────────────────────
/// <summary>
/// DbContext for the order-service — maps to PostgreSQL database `order_db`.
/// </summary>
public class OrderDbContext(DbContextOptions<OrderDbContext> opts) : DbContext(opts)
{
    public DbSet<Order> Orders => Set<Order>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Map entity to `orders` table — same as TypeORM @Entity({ name: "orders" }).
        modelBuilder.Entity<Order>(e =>
        {
            e.ToTable("orders");
            e.HasKey(o => o.Id);
            e.Property(o => o.Id).UseIdentityByDefaultColumn();
            // decimal(12,2) — mirrors TypeORM { type: "decimal", precision: 12, scale: 2 }.
            e.Property(o => o.TotalAmount)
             .HasColumnType("numeric(12,2)")
             .IsRequired();
            e.Property(o => o.CustomerId).IsRequired();
        });
    }
}

// ── Domain models ──────────────────────────────────────────────────────────
/// <summary>
/// Order entity — persisted to `orders` table in PostgreSQL.
/// Mirrors TypeScript Order entity: id (PK), customerId, totalAmount.
/// </summary>
public class Order
{
    public int     Id          { get; set; }
    public string  CustomerId  { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
}

/// <summary>
/// Request body for POST /orders.
/// productName and quantity are forwarded to the Kafka event for inventory consumption.
/// </summary>
public record CreateOrderRequest(
    string  CustomerId,
    decimal TotalAmount,
    string? ProductName,
    int?    Quantity
);
