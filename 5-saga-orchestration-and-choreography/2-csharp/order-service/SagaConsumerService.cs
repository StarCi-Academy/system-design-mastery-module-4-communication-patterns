// Saga event consumer — listens on saga.demo.events and updates order status in PostgreSQL.
// Mirrors TS SagaEventsController + OrdersService.handleSagaEvent logic.

using Confluent.Kafka;
using System.Text.Json;

namespace OrderService;

/// <summary>
/// Background service that consumes Kafka saga events and transitions order state.
/// INVENTORY_OK → COMPLETED; INVENTORY_OUT_OF_STOCK | PAYMENT_REFUNDED → CANCELLED.
/// </summary>
public sealed class SagaConsumerService(
    ConsumerConfig consumerConfig,
    IServiceScopeFactory scopeFactory,
    ILogger<SagaConsumerService> logger) : BackgroundService
{
    private const string Topic = "saga.demo.events";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Subscribe on a background thread so ASP.NET startup is not blocked.
        await Task.Run(() => ConsumeLoop(stoppingToken), stoppingToken);
    }

    private void ConsumeLoop(CancellationToken ct)
    {
        using var consumer = new ConsumerBuilder<string, string>(consumerConfig).Build();
        consumer.Subscribe(Topic);
        logger.LogInformation("Order-service saga consumer started on topic {Topic}", Topic);

        while (!ct.IsCancellationRequested)
        {
            try
            {
                var result = consumer.Consume(ct);
                if (result?.Message?.Value is null) continue;

                // Deserialize loosely to read the `event` discriminator field first.
                using var doc = JsonDocument.Parse(result.Message.Value);
                var root = doc.RootElement;

                if (!root.TryGetProperty("event", out var evtProp)) continue;
                var evtType = evtProp.GetString();

                // Only process events that carry an orderId relevant to order state.
                if (!root.TryGetProperty("orderId", out var orderIdProp)) continue;
                var orderId = orderIdProp.GetInt32();

                logger.LogInformation("Consumed saga event {Event} for order {OrderId}", evtType, orderId);

                // Determine target status from event type — mirrors TS handleSagaEvent.
                string? newStatus = evtType switch
                {
                    "INVENTORY_OK"            => "COMPLETED",
                    "INVENTORY_OUT_OF_STOCK"  => "CANCELLED",
                    "PAYMENT_REFUNDED"        => "CANCELLED",
                    _                         => null,
                };

                if (newStatus is null) continue;

                // Use a scoped DbContext per message to stay safe with lifetime management.
                using var scope = scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();

                var order = db.Orders.Find(orderId);
                if (order is null)
                {
                    logger.LogWarning("Order {OrderId} not found, skipping event {Event}", orderId, evtType);
                    continue;
                }

                order.Status = newStatus;
                db.SaveChanges();
                logger.LogInformation("Order {OrderId} transitioned to {Status}", orderId, newStatus);
            }
            catch (OperationCanceledException)
            {
                // Graceful shutdown.
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing saga event");
            }
        }

        consumer.Close();
    }
}
