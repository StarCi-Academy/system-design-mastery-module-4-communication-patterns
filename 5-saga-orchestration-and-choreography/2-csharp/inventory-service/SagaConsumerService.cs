// Saga event consumer for inventory-service — listens on saga.demo.events,
// routes PAYMENT_CAPTURED events to StockService.HandleSagaEventAsync.
// Mirrors TS SagaEventsController + StockService.handleSagaEvent.

using Confluent.Kafka;
using System.Text.Json;

namespace InventoryService;

/// <summary>
/// Background service that polls the Kafka saga topic and delegates to StockService.
/// Runs on a dedicated background thread to avoid blocking ASP.NET request handling.
/// </summary>
public sealed class SagaConsumerService(
    ConsumerConfig consumerConfig,
    IServiceScopeFactory scopeFactory,
    ILogger<SagaConsumerService> logger) : BackgroundService
{
    private const string Topic = "saga.demo.events";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Run(() => ConsumeLoop(stoppingToken), stoppingToken);
    }

    private void ConsumeLoop(CancellationToken ct)
    {
        using var consumer = new ConsumerBuilder<string, string>(consumerConfig).Build();
        consumer.Subscribe(Topic);
        logger.LogInformation("Inventory-service saga consumer started on topic {Topic}", Topic);

        while (!ct.IsCancellationRequested)
        {
            try
            {
                var result = consumer.Consume(ct);
                if (result?.Message?.Value is null) continue;

                using var doc = JsonDocument.Parse(result.Message.Value);
                var root = doc.RootElement;

                if (!root.TryGetProperty("event", out var evtProp)) continue;
                var evtType = evtProp.GetString();
                if (evtType is null) continue;

                // Extract common fields carried on PAYMENT_CAPTURED.
                var orderId   = root.TryGetProperty("orderId",   out var oi) ? oi.GetInt32() : 0;
                var productId = root.TryGetProperty("productId", out var pi) ? pi.GetInt32() : 0;
                var quantity  = root.TryGetProperty("quantity",  out var qi) ? qi.GetInt32() : 0;

                logger.LogInformation("Consumed saga event {Event} for order {OrderId}", evtType, orderId);

                // Use a scoped service to resolve StockService which depends on scoped Mongo collections.
                using var scope = scopeFactory.CreateScope();
                var stock = scope.ServiceProvider.GetRequiredService<StockService>();
                stock.HandleSagaEventAsync(evtType, orderId, productId, quantity).GetAwaiter().GetResult();
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing saga event in inventory-service");
            }
        }

        consumer.Close();
    }
}
