// Domain models for inventory-service (MongoDB).
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace InventoryService;

/// <summary>
/// Product document — stored in MongoDB `products` collection.
/// Mirrors TS ProductEntity (id, stock).
/// </summary>
public class Product
{
    [BsonId]
    [BsonRepresentation(BsonType.Int32)]
    public int Id { get; set; }

    /// <summary>Available stock units.</summary>
    public int Stock { get; set; }
}

/// <summary>
/// Fulfillment idempotency record — stored in MongoDB `fulfillments` collection.
/// Mirrors TS FulfillmentEntity (orderId, status).
/// Prevents duplicate stock decrements when ORDER_CREATED is consumed more than once.
/// </summary>
public class Fulfillment
{
    [BsonId]
    [BsonRepresentation(BsonType.Int32)]
    public int OrderId { get; set; }

    /// <summary>Fulfilment state — always "DONE" for completed reservations.</summary>
    public string Status { get; set; } = "DONE";
}

/// <summary>
/// Result shape returned by POST /check and used internally by tryFulfill.
/// </summary>
public record InventoryCheckResult(
    bool Ok,
    int OrderId,
    int ProductId,
    int Quantity,
    string Status,
    string Message,
    int? RemainingStock = null
);

/// <summary>
/// HTTP request body for POST /check — manual stock check endpoint.
/// </summary>
/// <param name="OrderId">Order requesting the stock reservation.</param>
/// <param name="ProductId">Product whose stock is being reserved.</param>
/// <param name="Quantity">Units to reserve.</param>
public record CheckRequest(int OrderId, int ProductId, int Quantity);
