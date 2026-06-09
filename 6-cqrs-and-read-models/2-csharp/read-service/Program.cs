// CQRS Read Service — ASP.NET Core 8 minimal API.
// Consumes "customer.profile.updated" events from RabbitMQ queue
// "cqrs.customer.profile" and projects them into an Elasticsearch index
// "customers". Serves GET /customer/:id queries from the read model.

using System.Text;
using System.Text.Json;
using Elastic.Clients.Elasticsearch;
using Elastic.Transport;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

var builder = WebApplication.CreateBuilder(args);

// ── Elasticsearch client (singleton) ─────────────────────────────────────
var esNode = Environment.GetEnvironmentVariable("ELASTICSEARCH_NODE") ?? "http://localhost:9200";
builder.Services.AddSingleton<ElasticsearchClient>(_ =>
{
    var settings = new ElasticsearchClientSettings(new Uri(esNode))
        .DefaultIndex("customers");
    return new ElasticsearchClient(settings);
});

// ── RabbitMQ connection factory (singleton) ───────────────────────────────
var rabbitUrl = Environment.GetEnvironmentVariable("RABBITMQ_URL") ?? "amqp://guest:guest@localhost:5672";
builder.Services.AddSingleton<IConnection>(_ =>
{
    var factory = new ConnectionFactory { Uri = new Uri(rabbitUrl) };
    // Retry — RabbitMQ container may not be ready immediately.
    for (var attempt = 0; attempt < 10; attempt++)
    {
        try { return factory.CreateConnection(); }
        catch
        {
            Console.WriteLine($"[read-service] RabbitMQ not ready (attempt {attempt + 1}/10), retrying in 3 s…");
            Thread.Sleep(3000);
        }
    }
    return factory.CreateConnection();
});

// ── Hosted service: RabbitMQ consumer ────────────────────────────────────
builder.Services.AddHostedService<CustomerProfileConsumer>();

var app = builder.Build();

// ── Ensure Elasticsearch index exists ────────────────────────────────────
var esClient = app.Services.GetRequiredService<ElasticsearchClient>();
await EnsureIndexAsync(esClient);

// ── GET /customer/:id ─────────────────────────────────────────────────────
// Queries the Elasticsearch read model for a customer by id.
app.MapGet("/customer/{id}", async (string id, ElasticsearchClient es) =>
{
    var response = await es.GetAsync<CustomerDoc>(id, idx => idx.Index("customers"));
    if (!response.IsValidResponse || response.Source is null)
        return Results.NotFound();
    return Results.Ok(response.Source);
});

var port = Environment.GetEnvironmentVariable("PORT") ?? "3001";
app.Run($"http://0.0.0.0:{port}");

// ── Ensure index helper ────────────────────────────────────────────────────
static async Task EnsureIndexAsync(ElasticsearchClient es)
{
    var exists = await es.Indices.ExistsAsync("customers");
    if (exists.Exists) return;

    var create = await es.Indices.CreateAsync<CustomerDoc>("customers", c => c
        .Mappings(m => m
            .Properties(p => p
                .Keyword(k => k.Id)
                .Text(t => t.Name)
                .Keyword(k => k.Email))));

    if (!create.IsValidResponse)
        Console.WriteLine($"[read-service] Index create warning: {create.DebugInformation}");
    else
        Console.WriteLine("[read-service] Elasticsearch index \"customers\" created.");
}

// ── CustomerDoc: Elasticsearch document model ─────────────────────────────
public record CustomerDoc(string Id, string Name, string Email);

// ── RabbitMQ consumer hosted service ─────────────────────────────────────
// Subscribes to "cqrs.customer.profile" queue, deserialises each message,
// and upserts the customer document into Elasticsearch.
public class CustomerProfileConsumer(
    IConnection        rabbitConn,
    ElasticsearchClient es,
    ILogger<CustomerProfileConsumer> logger) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var channel = rabbitConn.CreateModel();

        // Declare the same durable queue as the Write Service.
        channel.QueueDeclare(
            queue:      "cqrs.customer.profile",
            durable:    true,
            exclusive:  false,
            autoDelete: false,
            arguments:  null);

        // Process one message at a time to avoid overwhelming Elasticsearch.
        channel.BasicQos(prefetchSize: 0, prefetchCount: 1, global: false);

        var consumer = new EventingBasicConsumer(channel);
        consumer.Received += async (_, ea) =>
        {
            var json    = Encoding.UTF8.GetString(ea.Body.ToArray());
            var payload = JsonSerializer.Deserialize<CustomerPayload>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (payload is null)
            {
                logger.LogWarning("[read-service] Received null payload, skipping.");
                channel.BasicNack(ea.DeliveryTag, false, false);
                return;
            }

            logger.LogInformation(
                "[read-service] Received \"customer.profile.updated\" for customer \"{Id}\"",
                payload.Id);

            try
            {
                // Upsert into Elasticsearch read model so GET /customer/:id stays consistent.
                var doc = new CustomerDoc(payload.Id, payload.Name, payload.Email);
                await es.IndexAsync(doc, idx => idx
                    .Index("customers")
                    .Id(payload.Id));

                logger.LogInformation(
                    "[read-service] Processed \"customer.profile.updated\" for customer \"{Id}\"",
                    payload.Id);

                channel.BasicAck(ea.DeliveryTag, false);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[read-service] Failed to upsert customer \"{Id}\"", payload.Id);
                // Requeue on transient error so the message is not lost.
                channel.BasicNack(ea.DeliveryTag, false, true);
            }
        };

        channel.BasicConsume(
            queue:       "cqrs.customer.profile",
            autoAck:     false,   // Manual ack — same as noAck: false in TS.
            consumer:    consumer);

        stoppingToken.Register(() => channel.Close());
        return Task.CompletedTask;
    }

    private record CustomerPayload(string Id, string Name, string Email);
}
