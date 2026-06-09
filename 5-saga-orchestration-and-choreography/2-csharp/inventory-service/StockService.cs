// Core business logic — tryFulfill mirrors TS StockService.tryFulfill.
// Reads/writes products + fulfillments from MongoDB; emits INVENTORY_OK / INVENTORY_OUT_OF_STOCK.

using Confluent.Kafka;
using MongoDB.Driver;
using System.Text.Json;

namespace InventoryService;

/// <summary>
/// Encapsulates saga inventory step logic.
/// Checks stock in MongoDB, decrements atomically, records fulfillment for idempotency,
/// and emits the result event back to the Kafka saga topic.
/// </summary>
public sealed class StockService(
    IMongoCollection<Product> products,
    IMongoCollection<Fulfillment> fulfillments,
    IProducer<string, string> producer,
    ILogger<StockService> logger)
{
    private const string Topic = "saga.demo.events";

    /// <summary>
    /// Attempt to reserve <paramref name="quantity"/> units of product <paramref name="productId"/> for order <paramref name="orderId"/>.
    /// Emits INVENTORY_OK on success or INVENTORY_OUT_OF_STOCK on failure.
    /// Idempotent: duplicate calls for the same orderId return ALREADY_FULFILLED without re-emitting.
    /// </summary>
    /// <param name="orderId">Saga order identifier.</param>
    /// <param name="productId">Product to decrement stock for.</param>
    /// <param name="quantity">Units requested.</param>
    /// <returns>Result describing fulfillment outcome.</returns>
    public async Task<InventoryCheckResult> TryFulfillAsync(int orderId, int productId, int quantity)
    {
        // Idempotency check: if already fulfilled, skip duplicate processing.
        var existing = await fulfillments.Find(f => f.OrderId == orderId).FirstOrDefaultAsync();
        if (existing is not null)
        {
            return new InventoryCheckResult(true, orderId, productId, quantity,
                "ALREADY_FULFILLED", "Order has already been fulfilled");
        }

        // Validate stock before mutating inventory state.
        var product = await products.Find(p => p.Id == productId).FirstOrDefaultAsync();
        if (product is null || product.Stock < quantity)
        {
            // Publish compensation trigger so upstream services can rollback/cancel.
            await EmitAsync(new
            {
                @event    = "INVENTORY_OUT_OF_STOCK",
                orderId,
                productId,
            });
            logger.LogInformation("Out of stock for order {OrderId}", orderId);

            return new InventoryCheckResult(false, orderId, productId, quantity,
                "OUT_OF_STOCK", "Product is out of stock for requested quantity",
                product?.Stock ?? 0);
        }

        // Commit stock decrement and fulfillment marker in saga step order.
        var newStock = product.Stock - quantity;
        await products.UpdateOneAsync(
            p => p.Id == productId,
            Builders<Product>.Update.Set(p => p.Stock, newStock));

        await fulfillments.InsertOneAsync(new Fulfillment { OrderId = orderId, Status = "DONE" });

        // Publish success so order-service can mark order COMPLETED.
        await EmitAsync(new
        {
            @event    = "INVENTORY_OK",
            orderId,
            productId,
            quantity,
        });
        logger.LogInformation("Fulfilled order {OrderId}", orderId);

        return new InventoryCheckResult(true, orderId, productId, quantity,
            "FULFILLED", "Inventory reserved successfully", newStock);
    }

    /// <summary>
    /// Handle an incoming saga event — both ORDER_CREATED (simplified two-service
    /// choreography, no separate payment step) and PAYMENT_CAPTURED (full saga flow)
    /// trigger an inventory reservation attempt. Mirrors the Java inventory track.
    /// </summary>
    /// <param name="evtType">Event discriminator string.</param>
    /// <param name="orderId">Order identifier carried in the event.</param>
    /// <param name="productId">Product identifier carried in the event.</param>
    /// <param name="quantity">Quantity carried in the event.</param>
    public async Task HandleSagaEventAsync(string evtType, int orderId, int productId, int quantity)
    {
        // ORDER_CREATED (this C# track has no payment-service) or PAYMENT_CAPTURED
        // both trigger the reserve-stock step in the choreography flow.
        if (evtType == "ORDER_CREATED" || evtType == "PAYMENT_CAPTURED")
        {
            await TryFulfillAsync(orderId, productId, quantity);
        }
    }

    // Serialize and produce a saga event message.
    private async Task EmitAsync(object payload)
    {
        var json = JsonSerializer.Serialize(payload);
        await producer.ProduceAsync(Topic, new Message<string, string> { Value = json });
    }
}
