package com.starci.order;

import java.math.BigDecimal;

/**
 * Kafka event payload emitted on topic {@code order-events} after an order is saved.
 *
 * <p>Maps to the TS inline object:
 * {@code { orderId, customerId, totalAmount, productName, quantity }}.
 */
public class OrderEventPayload {

    private Long orderId;
    private String customerId;
    private BigDecimal totalAmount;
    // Optional — may be null when no product is specified.
    private String productName;
    // Optional — may be null when no quantity is specified.
    private Integer quantity;

    // No-arg constructor for Jackson serialisation.
    public OrderEventPayload() {}

    public OrderEventPayload(Long orderId, String customerId, BigDecimal totalAmount,
                             String productName, Integer quantity) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.totalAmount = totalAmount;
        this.productName = productName;
        this.quantity = quantity;
    }

    public Long getOrderId() { return orderId; }
    public String getCustomerId() { return customerId; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getProductName() { return productName; }
    public Integer getQuantity() { return quantity; }
}
