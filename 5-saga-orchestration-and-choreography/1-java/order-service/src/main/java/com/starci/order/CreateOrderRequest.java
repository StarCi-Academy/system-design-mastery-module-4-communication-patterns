package com.starci.order;

/**
 * CreateOrderRequest — request body DTO for {@code POST /order}.
 *
 * <p>Jackson deserialises the JSON body into this POJO; default constructor
 * required for deserialisation.
 */
public class CreateOrderRequest {

    // Product identifier — references a product known to the inventory service.
    private Long productId;

    // Units to order — validated by the inventory service against available stock.
    private Integer quantity;

    /** Default constructor for Jackson deserialisation. */
    public CreateOrderRequest() {}

    public Long getProductId() { return productId; }

    public void setProductId(Long productId) { this.productId = productId; }

    public Integer getQuantity() { return quantity; }

    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
