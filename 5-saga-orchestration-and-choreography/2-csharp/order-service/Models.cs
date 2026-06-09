// Domain models for order-service.
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OrderService;

/// <summary>
/// Order entity — persisted in PostgreSQL table `orders`.
/// Mirrors TS OrderEntity (id, productId, quantity, status).
/// </summary>
public class Order
{
    /// <summary>Auto-increment primary key.</summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>Product identifier referenced from product catalogue.</summary>
    public int ProductId { get; set; }

    /// <summary>Number of units ordered.</summary>
    public int Quantity { get; set; }

    /// <summary>Saga lifecycle state: PENDING → COMPLETED | CANCELLED.</summary>
    public string Status { get; set; } = "PENDING";
}

/// <summary>
/// HTTP request body for POST /order.
/// </summary>
/// <param name="ProductId">Product to order.</param>
/// <param name="Quantity">Units requested.</param>
public record OrderRequest(int ProductId, int Quantity);
