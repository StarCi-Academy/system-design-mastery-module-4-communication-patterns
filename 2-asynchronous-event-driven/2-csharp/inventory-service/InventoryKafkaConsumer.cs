// InventoryKafkaConsumer — subscribes to Kafka topic order-events as group inventory-consumer.
// Runs as a BackgroundService (hosted service) for the lifetime of the process.
// On ORDER_CREATED events, logs a stock decrement to demonstrate temporal decoupling.

using System.Text.Json;
using Confluent.Kafka;
using Microsoft.Extensions.Hosting;

/// <summary>
/// Long-running Kafka consumer for the Inventory domain.
/// Uses consumer group "inventory-consumer" so it receives every event independently
/// from other groups (fan-out / broadcast semantics).
/// </summary>
public class InventoryKafkaConsumer : BackgroundService
{
    /// <summary>
    /// Entry point called by the .NET Generic Host at startup.
    /// Runs the consume loop on a background thread so the host thread stays free.
    /// </summary>
    /// <param name="stoppingToken">Signalled when the host wants to shut down.</param>
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Offload the blocking consume loop to a thread-pool thread.
        // The loop blocks on consumer.Consume() which integrates with stoppingToken.
        return Task.Run(() =>
        {
            // Read Kafka bootstrap address from env so Docker Compose can inject it.
            var bootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS")
                ?? "localhost:9092";

            var config = new ConsumerConfig
            {
                // Address of the Kafka broker(s) — injected via Docker Compose env.
                BootstrapServers = bootstrapServers,
                // Distinct group: this consumer gets its own copy of every event.
                GroupId = "inventory-consumer",
                // Read from the beginning so events published before this service
                // started are replayed — demonstrates at-least-once delivery (Flow 4).
                AutoOffsetReset = AutoOffsetReset.Earliest
            };

            // Create the consumer and subscribe to the shared event topic.
            using var consumer = new ConsumerBuilder<string, string>(config).Build();
            consumer.Subscribe("order-events");

            // Consume in a tight loop until the host requests shutdown.
            while (!stoppingToken.IsCancellationRequested)
            {
                ConsumeResult<string, string>? result = null;
                try
                {
                    // Blocks until a message arrives or stoppingToken fires.
                    result = consumer.Consume(stoppingToken);
                }
                catch (ConsumeException ex)
                {
                    // Topic not yet created (e.g. broker started but no producer has published yet).
                    // Wait briefly and retry rather than crashing the entire host.
                    Console.WriteLine($"inventory-service  | Consume error (will retry): {ex.Error.Reason}");
                    Thread.Sleep(2000);
                    continue;
                }

                // Skip tombstone / null-payload messages.
                if (result?.Message?.Value == null) continue;

                // Parse the JSON event payload.
                var payload = JsonSerializer.Deserialize<JsonElement>(result.Message.Value);
                var eventType = payload.GetProperty("eventType").GetString();

                if (eventType == "ORDER_CREATED")
                {
                    // Extract individual fields from the event for logging.
                    var orderId = payload.GetProperty("orderId").GetInt32();
                    var productName = payload.GetProperty("productName").GetString();
                    var quantity = payload.GetProperty("quantity").GetInt32();

                    // Log format matches the expected body §2.1.5 output exactly.
                    Console.WriteLine($"inventory-service  | Received ORDER_CREATED: order {orderId} ({productName} x{quantity})");
                    // Simulate decrementing stock — a real service would update a DB here.
                    Console.WriteLine($"inventory-service  | Decrementing stock for \"{productName}\" by {quantity}...");
                }
            }
        }, stoppingToken);
    }
}
