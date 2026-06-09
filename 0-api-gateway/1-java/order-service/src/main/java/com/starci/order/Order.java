package com.starci.order;

/**
 * Order — domain record representing an order managed by the order-service.
 *
 * <p>The {@code status} field is always {@code "PENDING"} at creation —
 * this is a business invariant enforced by the service, not the gateway.
 */
public class Order {

    /** Auto-assigned integer id set by the service on creation. */
    private long id;

    /** Id of the product being ordered. */
    private long productId;

    /** Number of units ordered. */
    private int quantity;

    /**
     * Order lifecycle status. Always {@code "PENDING"} when first created.
     * Only the service can change it after creation.
     */
    private String status;

    /** No-arg constructor required by Jackson for deserialization. */
    public Order() {}

    /**
     * Full constructor used when creating a new order record.
     *
     * @param id        auto-increment id
     * @param productId product being ordered
     * @param quantity  units requested
     * @param status    lifecycle status (always "PENDING" at creation)
     */
    public Order(long id, long productId, int quantity, String status) {
        this.id = id;
        this.productId = productId;
        this.quantity = quantity;
        this.status = status;
    }

    /** @return the order id */
    public long getId() { return id; }

    /** @return the product id */
    public long getProductId() { return productId; }

    /** @return the quantity */
    public int getQuantity() { return quantity; }

    /** @return the order status */
    public String getStatus() { return status; }

    /** @param id sets the id */
    public void setId(long id) { this.id = id; }

    /** @param productId sets the product id */
    public void setProductId(long productId) { this.productId = productId; }

    /** @param quantity sets the quantity */
    public void setQuantity(int quantity) { this.quantity = quantity; }

    /** @param status sets the status */
    public void setStatus(String status) { this.status = status; }
}
