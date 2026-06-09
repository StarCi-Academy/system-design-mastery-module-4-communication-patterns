package com.starci.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Order — JPA entity persisted to the {@code orders} table in PostgreSQL.
 *
 * <p>Status lifecycle:
 * <ul>
 *   <li>{@code PENDING} — initial state after creation.</li>
 *   <li>{@code COMPLETED} — set when {@code INVENTORY_OK} saga event is received.</li>
 *   <li>{@code CANCELLED} — set when {@code INVENTORY_OUT_OF_STOCK} or {@code PAYMENT_REFUNDED} is received.</li>
 * </ul>
 */
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Product being ordered — matches productId field in the Kafka event.
    @Column(nullable = false)
    private Long productId;

    // Units requested — propagated into ORDER_CREATED event payload.
    @Column(nullable = false)
    private Integer quantity;

    // Current saga status — starts PENDING, transitions via Kafka events.
    @Column(nullable = false)
    private String status = "PENDING";

    /** Default constructor required by JPA. */
    public Order() {}

    /**
     * Convenience constructor used by the service layer.
     *
     * @param productId product identifier
     * @param quantity  units requested
     */
    public Order(Long productId, Integer quantity) {
        this.productId = productId;
        this.quantity = quantity;
        this.status = "PENDING";
    }

    public Long getId() { return id; }

    public Long getProductId() { return productId; }

    public void setProductId(Long productId) { this.productId = productId; }

    public Integer getQuantity() { return quantity; }

    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getStatus() { return status; }

    public void setStatus(String status) { this.status = status; }
}
