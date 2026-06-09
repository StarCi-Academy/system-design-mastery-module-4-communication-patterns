package com.starci.order;

import java.math.BigDecimal;

/**
 * REST request body for {@code POST /orders}.
 *
 * <p>Mirrors the TS controller body type:
 * {@code { customerId: string, totalAmount: number, productName?: string, quantity?: number }}.
 */
public class CreateOrderRequest {

    private String customerId;
    private BigDecimal totalAmount;
    // Optional — forwarded to the Kafka event for inventory decrement.
    private String productName;
    // Optional — forwarded to the Kafka event for inventory decrement.
    private Integer quantity;

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
