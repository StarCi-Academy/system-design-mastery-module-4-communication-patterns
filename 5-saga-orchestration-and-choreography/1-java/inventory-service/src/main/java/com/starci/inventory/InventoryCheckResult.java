package com.starci.inventory;

/**
 * InventoryCheckResult — response body returned by {@code POST /check}.
 *
 * <p>Mirrors the {@code InventoryCheckResult} type from the TS lesson source.
 */
public class InventoryCheckResult {

    private boolean ok;
    private Long orderId;
    private Long productId;
    private Integer quantity;
    private String status;
    private String message;
    // Only present when stock information is available (ok=true or out-of-stock case).
    private Integer remainingStock;

    /** Default constructor for Jackson serialisation. */
    public InventoryCheckResult() {}

    public boolean isOk() { return ok; }
    public void setOk(boolean ok) { this.ok = ok; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Integer getRemainingStock() { return remainingStock; }
    public void setRemainingStock(Integer remainingStock) { this.remainingStock = remainingStock; }
}
