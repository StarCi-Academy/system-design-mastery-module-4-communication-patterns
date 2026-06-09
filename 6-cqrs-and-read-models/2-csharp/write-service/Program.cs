// CQRS Write Service — ASP.NET Core 8 minimal API.
// Upserts customers to PostgreSQL (Write Model) and emits
// "customer.profile.updated" events to RabbitMQ queue "cqrs.customer.profile"
// so the Read Service can project them into Elasticsearch.

using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;

var builder = WebApplication.CreateBuilder(args);

// ── PostgreSQL via EF Core ─────────────────────────────────────────────────
var pgHost     = Environment.GetEnvironmentVariable("WRITE_DB_HOST")     ?? "localhost";
var pgPort     = Environment.GetEnvironmentVariable("WRITE_DB_PORT")     ?? "5432";
var pgUser     = Environment.GetEnvironmentVariable("WRITE_DB_USER")     ?? "cqrs";
var pgPassword = Environment.GetEnvironmentVariable("WRITE_DB_PASSWORD") ?? "cqrs";
var pgDb       = Environment.GetEnvironmentVariable("WRITE_DB_NAME")     ?? "cqrs_write";

var pgConn = $"Host={pgHost};Port={pgPort};Username={pgUser};Password={pgPassword};Database={pgDb}";
builder.Services.AddDbContext<WriteDbContext>(opt =>
    opt.UseNpgsql(pgConn));

// ── RabbitMQ connection (singleton factory + channel) ────────────────────
var rabbitUrl = Environment.GetEnvironmentVariable("RABBITMQ_URL") ?? "amqp://guest:guest@localhost:5672";
builder.Services.AddSingleton<IConnection>(_ =>
{
    var factory = new ConnectionFactory { Uri = new Uri(rabbitUrl) };
    // Retry loop — RabbitMQ may not be ready when the container starts.
    for (var attempt = 0; attempt < 10; attempt++)
    {
        try { return factory.CreateConnection(); }
        catch
        {
            Console.WriteLine($"[write-service] RabbitMQ not ready (attempt {attempt + 1}/10), retrying in 3 s…");
            Thread.Sleep(3000);
        }
    }
    return factory.CreateConnection();
});

builder.Services.AddSingleton<IModel>(sp =>
{
    var conn    = sp.GetRequiredService<IConnection>();
    var channel = conn.CreateModel();
    // Declare durable queue so messages survive broker restart.
    channel.QueueDeclare(
        queue:      "cqrs.customer.profile",
        durable:    true,
        exclusive:  false,
        autoDelete: false,
        arguments:  null);
    return channel;
});

var app = builder.Build();

// ── Apply EF Core migrations / create schema on startup ───────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WriteDbContext>();
    // EnsureCreated is sufficient for lab/demo — no production migration needed.
    db.Database.EnsureCreated();
}

// ── POST /customer/update ─────────────────────────────────────────────────
// Receives { id, name, email }, upserts the customer row in PostgreSQL,
// then publishes a CustomerProfileUpdated event to RabbitMQ.
app.MapPost("/customer/update", async (UpsertCustomerRequest req, WriteDbContext db, IModel channel) =>
{
    Console.WriteLine($"[write-service] Received update request for customer \"{req.Id}\"");

    // Upsert: find existing row or create a new one.
    var customer = await db.Customers.FindAsync(req.Id);
    if (customer is null)
    {
        customer = new CustomerEntity { Id = req.Id, Name = req.Name, Email = req.Email };
        db.Customers.Add(customer);
        Console.WriteLine($"[write-service] Created new customer profile for ID \"{req.Id}\"");
    }
    else
    {
        customer.Name  = req.Name;
        customer.Email = req.Email;
        Console.WriteLine($"[write-service] Updated existing customer profile for ID \"{req.Id}\"");
    }
    await db.SaveChangesAsync();

    // Publish event to RabbitMQ — Read Service consumes this to project into Elasticsearch.
    var payload = JsonSerializer.Serialize(new { req.Id, req.Name, req.Email });
    var body    = Encoding.UTF8.GetBytes(payload);
    var props   = channel.CreateBasicProperties();
    props.Persistent  = true;   // Survive broker restart.
    props.ContentType = "application/json";

    Console.WriteLine($"[write-service] Broadcasting \"customer.profile.updated\" for customer \"{req.Id}\"");
    channel.BasicPublish(
        exchange:   "",                        // Default exchange — route by queue name.
        routingKey: "cqrs.customer.profile",   // Must match Read Service consumer queue.
        basicProperties: props,
        body:       body);
    Console.WriteLine($"[write-service] Broadcast completed for \"customer.profile.updated\" and customer \"{req.Id}\"");

    return Results.Ok(customer);
});

var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
app.Run($"http://0.0.0.0:{port}");

// ── EF Core DbContext ─────────────────────────────────────────────────────
// Write Model: one table "customers" with id/name/email.
public class WriteDbContext(DbContextOptions<WriteDbContext> options) : DbContext(options)
{
    public DbSet<CustomerEntity> Customers => Set<CustomerEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CustomerEntity>(e =>
        {
            e.ToTable("customers");
            e.HasKey(c => c.Id);
            e.Property(c => c.Id).HasColumnName("id").IsRequired();
            e.Property(c => c.Name).HasColumnName("name").IsRequired();
            e.Property(c => c.Email).HasColumnName("email").IsRequired();
        });
    }
}

// ── Domain model ──────────────────────────────────────────────────────────
public class CustomerEntity
{
    public string Id    { get; set; } = "";
    public string Name  { get; set; } = "";
    public string Email { get; set; } = "";
}

// ── Request DTO ───────────────────────────────────────────────────────────
// Matches the TS controller body: { id, name, email }.
record UpsertCustomerRequest(string Id, string Name, string Email);
