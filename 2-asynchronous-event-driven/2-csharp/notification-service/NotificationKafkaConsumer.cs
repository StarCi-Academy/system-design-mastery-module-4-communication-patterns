// NotificationKafkaConsumer — subscribes to Kafka topic order-events as group notification-consumer.
// A DIFFERENT group from inventory-consumer: same event is delivered here too (broadcast / fan-out).
// On ORDER_CREATED events, logs a notification send to demonstrate fan-out semantics.

using System.Text.Json;
using Confluent.Kafka;
using Microsoft.Extensions.Hosting;

/// <summary>
/// Long-running Kafka consumer for the Notification domain.
/// Uses consumer group "notification-consumer" — distinct from "inventory-consumer" —
/// so Kafka delivers a full independent copy of every event to this group as well.
/// </summary>
public class NotificationKafkaConsumer : BackgroundService
{
    /// <summary>
    /// Entry point called by the .NET Generic Host at startup.
    /// Offloads the blocking consume loop to a background thread.
    /// </summary>
    /// <param name="stoppingToken">Signalled when the host wants to shut down.</param>
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return Task.Run(() =>
        {
            // Read Kafka bootstrap address from env so Docker Compose can inject it.
            var bootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS")
                ?? "localhost:9092";

            var config = new ConsumerConfig
            {
                // Address of the Kafka broker(s) — injected via Docker Compose env.
                BootstrapServers = bootstrapServers,
                // A different group from inventory: same event is delivered here too (broadcast).
                GroupId = "notification-consumer",
                // Earliest so this consumer replays events it missed while down (Flow 4).
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
                    Console.WriteLine($"notification-service | Consume error (will retry): {ex.Error.Reason}");
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
                    Console.WriteLine($"notification-service | Received ORDER_CREATED: order {orderId} ({productName} x{quantity})");
                    // Simulate sending a notification — a real service would call email/SMS here.
                    Console.WriteLine($"notification-service | Sending notification for order {orderId}...");
                }
            }
        }, stoppingToken);
    }
}
