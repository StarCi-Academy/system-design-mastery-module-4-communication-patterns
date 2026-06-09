package com.starci.inventory;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Kafka event payload received on topic {@code order-events}.
 *
 * <p>Mirrors the TS {@code OrderEventPayload} interface:
 * {@code { productName?: string, quantity?: number }}.
 * Additional fields (orderId, customerId, totalAmount) are present in the
 * emitted message but are intentionally ignored by this consumer.
 *
 * <p>{@code ignoreUnknown = true} is required because the Order Service emits
 * a richer payload; the inventory side only needs {@code productName} and
 * {@code quantity}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderEventPayload {

    // Optional — present only when the order references a product.
    private String productName;

    // Optional — present only when the order specifies a quantity.
    private Integer quantity;

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
