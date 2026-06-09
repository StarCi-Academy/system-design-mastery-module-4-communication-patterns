package com.starci.inventory;

/**
 * CheckRequest — request body DTO for {@code POST /check}.
 *
 * <p>Mirrors the TS controller's inline type {@code { orderId, productId, quantity }}.
 */
public class CheckRequest {

    // Order identifier — used for idempotency deduplication.
    private Long orderId;

    // Product to reserve stock for.
    private Long productId;

    // Units requested.
    private Integer quantity;

    /** Default constructor for Jackson deserialisation. */
    public CheckRequest() {}

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
