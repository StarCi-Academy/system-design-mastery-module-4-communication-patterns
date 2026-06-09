package com.starci.inventory;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Fulfillment — MongoDB document used for idempotency deduplication.
 *
 * <p>Written once per orderId when stock is successfully reserved.
 * On duplicate ORDER_CREATED events the service detects the existing document
 * and skips re-processing, preventing double-decrements.
 */
@Document(collection = "fulfillments")
public class Fulfillment {

    @Id
    // orderId is the primary key — one fulfillment record per order.
    private Long orderId;

    // Status value; always "DONE" for successfully fulfilled orders.
    private String status;

    /** Default constructor required by Spring Data MongoDB. */
    public Fulfillment() {}

    /**
     * Convenience constructor.
     *
     * @param orderId the order this fulfillment belongs to
     * @param status  fulfillment outcome, always {@code "DONE"}
     */
    public Fulfillment(Long orderId, String status) {
        this.orderId = orderId;
        this.status = status;
    }

    public Long getOrderId() { return orderId; }

    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getStatus() { return status; }

    public void setStatus(String status) { this.status = status; }
}
